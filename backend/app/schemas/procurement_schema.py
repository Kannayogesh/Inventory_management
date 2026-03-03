from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProcurementBase(BaseModel):
    category_id: int
    quantity: int = Field(..., gt=0)
    reason: str = Field(..., max_length=1000)

class ProcurementCreate(ProcurementBase):
    pass

class ProcurementUpdate(BaseModel):
    quantity: Optional[int] = Field(None, gt=0)
    reason: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(Pending|Approved|Rejected|Ordered)$")

class ProcurementResponse(ProcurementBase):
    request_id: int
    requested_by: int
    status: str
    requested_date: datetime
    approved_by: Optional[int] = None
    approved_date: Optional[datetime] = None
