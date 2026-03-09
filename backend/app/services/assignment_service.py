from fastapi import HTTPException, status, BackgroundTasks
from app.repositories import assignment_repository, asset_repository, user_repository
from app.schemas.assignment_schema import AssignmentCreate, AssignmentUpdate, ReturnRequest
from app.services.email_service import send_email_background_task

def get_assignments(current_user: dict):
    assignments = assignment_repository.get_all_assignments()
    if current_user.get("role") == "Employee":
        return [a for a in assignments if a["user_id"] == current_user.get("user_id")]
    return assignments

def get_assignment(assignment_id: int):
    assignment = assignment_repository.get_assignment_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment

def create_assignment(assignment_data: AssignmentCreate, current_user: dict, background_tasks: BackgroundTasks):
    # Retrieve user by employee_code
    target_user = user_repository.get_user_by_employee_code(assignment_data.employee_code)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User with this Employee ID not found")
        
    # Verify the target user is an Employee (Admin and AM asset assignment is not needed)
    if target_user["role"] != "Employee":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assets can only be assigned to users with the 'Employee' role.")
        
    # Verify the asset is available
    asset = asset_repository.get_asset_by_id(assignment_data.asset_id)
    if not asset or asset["status"] != "Available":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset is not available for assignment.")
    
    # Create the assignment
    new_id = assignment_repository.create_assignment(
        asset_id=assignment_data.asset_id,
        user_id=target_user["user_id"],
        approved_by=current_user.get("user_id"),
        status="Active",
        condition_at_issue=assignment_data.condition_at_issue,
        expected_return_date=assignment_data.expected_return_date,
        remarks=assignment_data.remarks
    )
    
    # Update Asset status to Assigned
    asset_repository.update_asset(assignment_data.asset_id, {"status": "Assigned"})
    
    # Trigger Asset Assignment Email
    background_tasks.add_task(
        send_email_background_task,
        title=f"New Asset Assigned - {asset['model']}",
        body=f"Hello {target_user['full_name']},\n\nYou have been newly assigned the asset: {asset['model']} (Tag: {asset['asset_tag']}).\nExpected return date: {assignment_data.expected_return_date or 'N/A'}.",
        recipient=target_user['email']
    )
    
    # Trigger Low Stock Alert 
    # Check remaining available assets for this category
    conn = user_repository.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) as available_count FROM Assets 
        WHERE category_id = ? AND status = 'Available'
    """, (asset["category_id"],))
    count_result = cursor.fetchone()
    available_count = count_result.available_count if count_result else 0
    
    LOW_STOCK_THRESHOLD = 3
    if available_count < LOW_STOCK_THRESHOLD:
        # Fetch admins
        cursor.execute("SELECT email FROM Users WHERE role = 'Admin'")
        admin_rows = cursor.fetchall()
        for row in admin_rows:
            background_tasks.add_task(
                send_email_background_task,
                title=f"Low Stock Alert - Category ID: {asset['category_id']}",
                body=f"Hello Admin,\n\nThe available stock for Asset Category ID {asset['category_id']} has dropped to {available_count}. Please procure more units.",
                recipient=row.email
            )
    conn.close()
    
    return get_assignment(new_id)

def update_assignment(assignment_id: int, assignment_data: AssignmentUpdate, background_tasks: BackgroundTasks):
    updates = assignment_data.model_dump(exclude_unset=True)
    
    # If returned_date is set, imply the asset is returned and close assignment
    if updates.get("returned_date"):
        updates["status"] = "Completed"
        
    success = assignment_repository.update_assignment(assignment_id, updates)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        
    assignment = get_assignment(assignment_id)
    if assignment["status"] == "Completed":
        # Free up the asset back to Available or Maintenance depending on return condition
        condition = updates.get("condition_at_return", "Good")
        new_asset_status = "Available" if condition in ["New", "Good", "Fair"] else "Maintenance"
        asset_repository.update_asset(assignment["asset_id"], {
            "status": new_asset_status,
            "condition_status": condition
        })
        
        # Trigger Asset Return Email
        asset_info = asset_repository.get_asset_by_id(assignment["asset_id"])
        conn = user_repository.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT full_name, email FROM Users WHERE user_id = ?", (assignment["user_id"]))
        row = cursor.fetchone()
        conn.close()
        
        if row and asset_info:
             user_full_name = getattr(row, 'full_name', row[0])
             user_email = getattr(row, 'email', row[1])
             
             background_tasks.add_task(
                send_email_background_task,
                title=f"Asset Returned Successfully - {asset_info['model']}",
                body=f"Hello {user_full_name},\n\nThe asset {asset_info['model']} has been successfully returned and recorded.",
                recipient=user_email
            )
        
    return assignment

def send_confirmation_reminder(assignment_id: int, background_tasks: BackgroundTasks):
    assignment = get_assignment(assignment_id)
    if assignment["status"] == "Completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send reminder for completed assignment")
        
    # Get user email
    conn = user_repository.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT full_name, email FROM Users WHERE user_id = ?", (assignment["user_id"]))
    row = cursor.fetchone()
    conn.close()
    
    # Get asset details
    asset_info = asset_repository.get_asset_by_id(assignment["asset_id"])
    
    if row and asset_info:
        # pyodbc row can be accessed by index or by column name getattr
        user_full_name = getattr(row, 'full_name', row[0])
        user_email = getattr(row, 'email', row[1])
        
        background_tasks.add_task(
            send_email_background_task,
            title=f"ACTION REQUIRED: Confirm Asset Assignment - {asset_info['model']}",
            body=f"Hello {user_full_name},\n\nPlease confirm receipt of your newly assigned asset: {asset_info['model']}.\nThank you.",
            recipient=user_email
        )
        return {"message": "Reminder email scheduled successfully"}
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or Asset not found")

def return_assignment(assignment_id: int, return_data: ReturnRequest, current_user: dict, background_tasks: BackgroundTasks):
    assignment = get_assignment(assignment_id)
    
    # Permission check: Only Admin/Asset Managers can return any assignments.
    if current_user.get("role") not in ["Admin", "Asset Manager"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admins or Asset Managers can process asset returns.")
    
    if assignment["status"] == "Completed" or assignment.get("returned_date"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset is already returned.")

    from datetime import date
    
    # Prepare update data
    # We use a dict here because we'll pass it to assignment_repository.update_assignment
    # while also triggering the email logic in update_assignment if we call it, 
    # OR we just implement the email trigger here. 
    # Let's call update_assignment to keep it consistent.
    
    # We need to create an AssignmentUpdate object for update_assignment
    update_data = AssignmentUpdate(
        returned_date=date.today(),
        condition_at_return=return_data.condition_at_return,
        status="Completed"
    )
    
    # Combine remarks
    final_remarks = assignment.get("remarks") or ""
    if return_data.remarks:
        final_remarks = f"{final_remarks} | Return Note: {return_data.remarks}"
    update_data.remarks = final_remarks
    
    return update_assignment(assignment_id, update_data, background_tasks)
