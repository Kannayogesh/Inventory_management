from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class AssetBase(BaseModel):
    asset_tag: str = Field(..., max_length=50)
    serial_number: Optional[str] = Field(None, max_length=120)
    category_id: int
    brand: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    configuration: Optional[str] = Field(None, max_length=500)
    purchase_date: Optional[date] = None
    purchase_cost: Optional[float] = None
    depreciation_years: Optional[int] = None
    warranty_expiry: Optional[date] = None
    location: Optional[str] = Field(None, max_length=100)
    condition_status: str = Field("New", pattern="^(New|Good|Fair|Damaged)$")
    status: str = Field("Available", pattern="^(Available|Assigned|Maintenance|Retired)$")
    invoice_path: Optional[str] = Field(None, max_length=500)

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    serial_number: Optional[str] = Field(None, max_length=120)
    category_id: Optional[int] = None
    brand: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    configuration: Optional[str] = Field(None, max_length=500)
    purchase_date: Optional[date] = None
    purchase_cost: Optional[float] = None
    depreciation_years: Optional[int] = None
    warranty_expiry: Optional[date] = None
    location: Optional[str] = Field(None, max_length=100)
    condition_status: Optional[str] = Field(None, pattern="^(New|Good|Fair|Damaged)$")
    status: Optional[str] = Field(None, pattern="^(Available|Assigned|Maintenance|Retired)$")
    invoice_path: Optional[str] = Field(None, max_length=500)

class AssetResponse(AssetBase):
    asset_id: int
    current_value: Optional[float] = None
    last_audit_date: Optional[date] = None
    created_at: datetime
