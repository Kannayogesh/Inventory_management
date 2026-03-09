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

def update_request(maintenance_id: int, request_data: MaintenanceUpdate, background_tasks: BackgroundTasks, current_user: dict):
    updates = request_data.model_dump(exclude_unset=True)
    
    status_val = updates.get("status")
    if status_val == "Resolved":
        updates["resolved_date"] = datetime.now()
        
    success = maintenance_repository.update_maintenance_request(maintenance_id, updates)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found")
        
    request = get_request(maintenance_id)
    
    if status_val:
        maintenance_repository.record_maintenance_history(
            maintenance_id=maintenance_id,
            status=status_val,
            notes=request_data.remarks or f"Status changed to {status_val}",
            performed_by=current_user.get("user_id")
        )
        
        asset_update = {}
        if status_val == "Resolved":
            asset_update = {"status": "Available", "condition_status": "Good"}
        elif status_val == "Under Process":
            asset_update = {"status": "Maintenance"}
        elif status_val == "Cannot Be Resolved":
            asset_update = {"status": "Retired", "condition_status": "Damaged"}
            
        if asset_update:
            asset_repository.update_asset(request["asset_id"], asset_update)
            
        conn = user_repository.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT full_name, email FROM Users WHERE user_id = ?", (request["reported_by"],))
        user_row = cursor.fetchone()
        conn.close()

        if user_row:
            user_full_name = getattr(user_row, 'full_name', user_row[0])
            user_email = getattr(user_row, 'email', user_row[1])
            
            email_subject = ""
            email_body = ""
            if status_val == "Under Process":
                email_subject = "Asset Under Maintenance"
                email_body = f"Hello {user_full_name},\n\nYour assigned asset is currently under maintenance and is being repaired by the support team.\n\nContact management for further information.\n\nRegards\nAsset Management Team\nPAL Inventory System"
            elif status_val == "Resolved":
                email_subject = "Asset Maintenance Completed"
                email_body = f"Hello {user_full_name},\n\nThe maintenance process for your assigned asset has been completed successfully.\nThe asset is now available.\n\nContact management for further information.\n\nRegards\nAsset Management Team\nPAL Inventory System"
            elif status_val == "Cannot Be Resolved":
                email_subject = "Asset Cannot Be Repaired"
                email_body = f"Hello {user_full_name},\n\nThe assigned asset cannot be repaired and may require replacement or retirement.\n\nContact management for further information.\n\nRegards\nAsset Management Team\nPAL Inventory System"
                
            if email_subject:
                background_tasks.add_task(
                    send_email_background_task,
                    title=email_subject,
                    body=email_body,
                    recipient=user_email
                )
        
    return request

def get_history(asset_id: int):
    return maintenance_repository.get_maintenance_history_by_asset(asset_id)
