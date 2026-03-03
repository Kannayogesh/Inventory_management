from fastapi import APIRouter, Depends
from typing import List

from app.schemas.asset_schema import AssetCreate, AssetUpdate, AssetResponse
from app.services import asset_service
from app.middleware.role_middleware import get_current_user, require_role

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("/", response_model=List[AssetResponse])
def get_all_assets(current_user: dict = Depends(get_current_user)):
    return asset_service.get_assets(current_user)

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, current_user: dict = Depends(get_current_user)):
    return asset_service.get_asset(asset_id)

@router.post("/", response_model=AssetResponse)
def create_asset(
    asset_data: AssetCreate, 
    current_user: dict = Depends(require_role(["Admin", "Asset Manager"]))
):
    return asset_service.create_asset(asset_data)

@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int, 
    asset_data: AssetUpdate, 
    current_user: dict = Depends(require_role(["Admin", "Asset Manager"]))
):
    return asset_service.update_asset(asset_id, asset_data)

@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int, 
    current_user: dict = Depends(require_role(["Admin", "Asset Manager"]))
):
    return asset_service.delete_asset(asset_id)
