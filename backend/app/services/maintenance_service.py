from fastapi import HTTPException, status, BackgroundTasks
from datetime import datetime
from app.repositories import maintenance_repository, asset_repository, user_repository
from app.schemas.maintenance_schema import MaintenanceCreate, MaintenanceUpdate
from app.services.email_service import send_email_background_task

def get_all_requests(current_user: dict):
    requests = maintenance_repository.get_all_maintenance_requests()
    if current_user.get("role") == "Employee":
        return [r for r in requests if r["reported_by"] == current_user.get("user_id")]
    return requests

def get_request(maintenance_id: int):
    request = maintenance_repository.get_maintenance_request_by_id(maintenance_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found")
    return request

def create_request(request_data: MaintenanceCreate, current_user: dict, background_tasks: BackgroundTasks):
    asset = asset_repository.get_asset_by_id(request_data.asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
        
    new_id = maintenance_repository.create_maintenance_request(
        asset_id=request_data.asset_id,
        reported_by=current_user.get("user_id"),
        issue_description=request_data.issue_description,
        remarks=request_data.remarks
    )
    
    asset_repository.update_asset(request_data.asset_id, {
        "status": "Maintenance",
        "condition_status": "Damaged"
    })
    
    # Notify User via Email
    background_tasks.add_task(
        send_email_background_task,
        title=f"Maintenance Request Created - Asset #{asset['asset_tag']}",
        body=f"Your maintenance request for {asset['model']} has been submitted.",
        recipient=current_user.get("email")
    )
    
    return get_request(new_id)

def update_request(maintenance_id: int, request_data: MaintenanceUpdate, background_tasks: BackgroundTasks):
    updates = request_data.model_dump(exclude_unset=True)
    
    if updates.get("status") == "Resolved":
        updates["resolved_date"] = datetime.now()
        
    success = maintenance_repository.update_maintenance_request(maintenance_id, updates)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found")
        
    request = get_request(maintenance_id)
    
    if request["status"] == "Resolved":
        asset_repository.update_asset(request["asset_id"], {
            "status": "Available",
            "condition_status": "Good"
        })
        
        # We need the user email to notify them
        user = user_repository.get_user_by_email(request["reported_by"]) # assumes ID fetching added later if needed, passing blank for now if none (needs user ID to email match)
        
        # In current repo, reported_by is the user_id integer.
        conn = user_repository.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT full_name, email FROM Users WHERE user_id = ?", (request["reported_by"],))
        user_row = cursor.fetchone()
        conn.close()

        if user_row:
            user_full_name = getattr(user_row, 'full_name', user_row[0])
            user_email = getattr(user_row, 'email', user_row[1])

            background_tasks.add_task(
                send_email_background_task,
                title=f"Maintenance Resolved - Asset #{request['asset_id']}",
                body=f"Hello {user_full_name},\n\nThe maintenance request for the asset you reported has been resolved.",
                recipient=user_email
            )
        
    return request
