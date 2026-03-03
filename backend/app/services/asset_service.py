from fastapi import HTTPException, status
from app.repositories import asset_repository
from app.schemas.asset_schema import AssetCreate, AssetUpdate

def get_assets(current_user: dict):
    # Only return all assets regardless of role for now, as assignment is handled in a separate table.
    return asset_repository.get_all_assets()

def get_asset(asset_id: int):
    asset = asset_repository.get_asset_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset

def create_asset(asset_data: AssetCreate):
    new_id = asset_repository.create_asset(
        asset_tag=asset_data.asset_tag,
        category_id=asset_data.category_id,
        condition_status=asset_data.condition_status,
        status=asset_data.status,
        serial_number=asset_data.serial_number,
        brand=asset_data.brand,
        model=asset_data.model,
        configuration=asset_data.configuration,
        purchase_date=asset_data.purchase_date,
        purchase_cost=asset_data.purchase_cost,
        depreciation_years=asset_data.depreciation_years,
        warranty_expiry=asset_data.warranty_expiry,
        location=asset_data.location,
    )
    return get_asset(new_id)

def update_asset(asset_id: int, asset_data: AssetUpdate):
    updates = asset_data.model_dump(exclude_unset=True)
    success = asset_repository.update_asset(asset_id, updates)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return get_asset(asset_id)

def delete_asset(asset_id: int):
    success = asset_repository.delete_asset(asset_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return {"message": "Asset deleted successfully"}
