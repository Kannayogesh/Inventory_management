from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    category_name: str
    description: Optional[str] = None

class CategoryResponse(CategoryBase):
    category_id: int

    class Config:
        from_attributes = True
