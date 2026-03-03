from fastapi import APIRouter, Depends
from typing import List
from app.schemas.category_schema import CategoryResponse
from app.services import category_service
from app.middleware.role_middleware import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryResponse])
def get_categories(current_user: dict = Depends(get_current_user)):
    return category_service.get_categories()
