from pydantic import BaseModel, Field
from typing import Optional

class RegisterRequest(BaseModel):
    employee_code: str
    full_name: str
    email: str
    password: str
    role: Optional[str] = Field("Employee", pattern="^(Admin|Asset Manager|Employee)$")
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    joining_date: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
