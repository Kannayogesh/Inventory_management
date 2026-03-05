from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class AssignmentBase(BaseModel):
    asset_id: int
    user_id: int
    expected_return_date: Optional[date] = None
    condition_at_issue: Optional[str] = Field(None, pattern="^(New|Good|Fair|Damaged)$")
    remarks: Optional[str] = Field(None, max_length=500)

class AssignmentCreate(BaseModel):
    asset_id: int
    employee_code: str
    expected_return_date: Optional[date] = None
    condition_at_issue: Optional[str] = Field(None, pattern="^(New|Good|Fair|Damaged)$")
    remarks: Optional[str] = Field(None, max_length=500)

class AssignmentUpdate(BaseModel):
    expected_return_date: Optional[date] = None
    returned_date: Optional[date] = None
    condition_at_return: Optional[str] = Field(None, pattern="^(New|Good|Fair|Damaged)$")
    confirmation_status: Optional[str] = Field(None, pattern="^(Pending|Confirmed)$")
    status: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=500)

class AssignmentResponse(AssignmentBase):
    assignment_id: int
    assigned_date: date
    returned_date: Optional[date] = None
    approved_by: int
    condition_at_return: Optional[str] = None
    confirmation_status: str
    status: str

class ReturnRequest(BaseModel):
    returned_date: Optional[date] = None
    condition_at_return: str = Field(..., pattern="^(New|Good|Fair|Damaged)$")
    remarks: Optional[str] = Field(None, max_length=500)
