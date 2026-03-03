from fastapi import HTTPException, status
from datetime import datetime
from app.repositories import procurement_repository
from app.schemas.procurement_schema import ProcurementCreate, ProcurementUpdate

def get_all_requests(current_user: dict):
    requests = procurement_repository.get_all_procurement_requests()
    if current_user.get("role") == "Employee":
        return [r for r in requests if r["requested_by"] == current_user.get("user_id")]
    return requests

def get_request(request_id: int):
    request = procurement_repository.get_procurement_request_by_id(request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procurement request not found")
    return request

def create_request(request_data: ProcurementCreate, current_user: dict):
    new_id = procurement_repository.create_procurement_request(
        category_id=request_data.category_id,
        requested_by=current_user.get("user_id"),
        quantity=request_data.quantity,
        reason=request_data.reason
    )
    return get_request(new_id)

def update_request(request_id: int, request_data: ProcurementUpdate, current_user: dict):
    updates = request_data.model_dump(exclude_unset=True)
    
    if updates.get("status") in ["Approved", "Rejected"]:
        updates["approved_by"] = current_user.get("user_id")
        updates["approved_date"] = datetime.now()
        
    success = procurement_repository.update_procurement_request(request_id, updates)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procurement request not found")
        
    return get_request(request_id)
