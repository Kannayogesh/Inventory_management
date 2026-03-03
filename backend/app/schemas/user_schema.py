from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

class UserBase(BaseModel):
    employee_code: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    designation: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    joining_date: Optional[date] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
