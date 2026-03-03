from fastapi import APIRouter, Depends
from typing import List

from app.schemas.procurement_schema import ProcurementCreate, ProcurementUpdate, ProcurementResponse
from app.services import procurement_service
from app.middleware.role_middleware import get_current_user, require_role

router = APIRouter(prefix="/procurement", tags=["Procurement Requests"])

@router.get("/", response_model=List[ProcurementResponse])
def get_all_requests(current_user: dict = Depends(get_current_user)):
    return procurement_service.get_all_requests(current_user)

@router.get("/{request_id}", response_model=ProcurementResponse)
def get_request(request_id: int, current_user: dict = Depends(get_current_user)):
    return procurement_service.get_request(request_id)

@router.post("/", response_model=ProcurementResponse)
def create_request(
    request_data: ProcurementCreate, 
    current_user: dict = Depends(require_role(["Admin", "Asset Manager", "Employee"]))
):
    return procurement_service.create_request(request_data, current_user)

@router.put("/{request_id}", response_model=ProcurementResponse)
def update_request(
    request_id: int, 
    request_data: ProcurementUpdate, 
    current_user: dict = Depends(require_role(["Admin", "Asset Manager"]))
):
    return procurement_service.update_request(request_id, request_data, current_user)
