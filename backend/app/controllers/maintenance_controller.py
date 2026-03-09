from fastapi import APIRouter, Depends, BackgroundTasks
from typing import List

from app.schemas.maintenance_schema import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse, MaintenanceHistoryResponse
from app.services import maintenance_service
from app.middleware.role_middleware import get_current_user, require_role

router = APIRouter(prefix="/maintenance", tags=["Asset Maintenance"])

@router.get("/", response_model=List[MaintenanceResponse])
def get_all_requests(current_user: dict = Depends(get_current_user)):
    return maintenance_service.get_all_requests(current_user)

@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_request(maintenance_id: int, current_user: dict = Depends(get_current_user)):
    return maintenance_service.get_request(maintenance_id)

@router.post("/", response_model=MaintenanceResponse)
def create_request(
    request_data: MaintenanceCreate, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    return maintenance_service.create_request(request_data, current_user, background_tasks)

@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def update_request(
    maintenance_id: int, 
    request_data: MaintenanceUpdate, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(["Admin", "Asset Manager"]))
):
    return maintenance_service.update_request(maintenance_id, request_data, background_tasks, current_user)

@router.get("/history/asset/{asset_id}", response_model=List[MaintenanceHistoryResponse])
def get_asset_history(asset_id: int, current_user: dict = Depends(get_current_user)):
    return maintenance_service.get_history(asset_id)
