from fastapi import HTTPException, status
from app.repositories import assignment_repository, asset_repository
from app.schemas.assignment_schema import AssignmentCreate, AssignmentUpdate

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

def create_assignment(assignment_data: AssignmentCreate, current_user: dict):
    # Verify the asset is available
    asset = asset_repository.get_asset_by_id(assignment_data.asset_id)
    if not asset or asset["status"] != "Available":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset is not available for assignment.")
    
    # Create the assignment
    new_id = assignment_repository.create_assignment(
        asset_id=assignment_data.asset_id,
        user_id=assignment_data.user_id,
        approved_by=current_user.get("user_id"),
        status="Active",
        condition_at_issue=assignment_data.condition_at_issue,
        expected_return_date=assignment_data.expected_return_date,
        remarks=assignment_data.remarks
    )
    
    # Update Asset status to Assigned
    asset_repository.update_asset(assignment_data.asset_id, {"status": "Assigned"})
    
    return get_assignment(new_id)

def update_assignment(assignment_id: int, assignment_data: AssignmentUpdate):
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
        
    return assignment
