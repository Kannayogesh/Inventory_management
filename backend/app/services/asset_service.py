from fastapi import HTTPException, status, UploadFile
from app.repositories import asset_repository
from app.schemas.asset_schema import AssetCreate, AssetUpdate
import os
import shutil
import uuid

def save_upload_file(upload_file: UploadFile) -> str:
    if not upload_file:
        return None
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

    # Ensure uploads directory exists
    if not os.path.exists(UPLOADS_DIR):
        os.makedirs(UPLOADS_DIR)
        
    # Generate unique filename
    file_ext = os.path.splitext(upload_file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOADS_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
        
    # Return relative path for URL serving
    return f"/uploads/{filename}"

def get_assets(current_user: dict):
    # Only return all assets regardless of role for now, as assignment is handled in a separate table.
    return asset_repository.get_all_assets()

def get_asset(asset_id: int):
    asset = asset_repository.get_asset_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset

def create_asset(asset_data: AssetCreate, invoice_file: UploadFile = None):
    invoice_path = asset_data.invoice_path
    if invoice_file:
        invoice_path = save_upload_file(invoice_file)
        
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
        invoice_path=invoice_path,
    )
    return get_asset(new_id)

def update_asset(asset_id: int, asset_data: AssetUpdate, invoice_file: UploadFile = None):
    updates = asset_data.model_dump(exclude_unset=True)
    
    if invoice_file:
        updates["invoice_path"] = save_upload_file(invoice_file)
        
    success = asset_repository.update_asset(asset_id, updates)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return get_asset(asset_id)

def delete_asset(asset_id: int):
    success = asset_repository.delete_asset(asset_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return {"message": "Asset deleted successfully"}
