from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MaintenanceBase(BaseModel):
    asset_id: int
    issue_description: str = Field(..., max_length=1000)
    remarks: Optional[str] = Field(None, max_length=500)

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceUpdate(BaseModel):
    issue_description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(Open|In Progress|Resolved)$")
    remarks: Optional[str] = Field(None, max_length=500)
    resolved_date: Optional[datetime] = None

class MaintenanceResponse(MaintenanceBase):
    maintenance_id: int
    reported_by: int
    status: str
    reported_date: datetime
    resolved_date: Optional[datetime] = None
