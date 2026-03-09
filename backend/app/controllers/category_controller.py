from fastapi import APIRouter, Depends
from typing import List
from app.schemas.category_schema import CategoryResponse, CategoryBase
from app.services import category_service
from app.middleware.role_middleware import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryResponse])
def get_categories(current_user: dict = Depends(get_current_user)):
    return category_service.get_categories()

@router.post("/", response_model=CategoryResponse)
def create_category(request: CategoryBase, current_user: dict = Depends(get_current_user)):
    """Create a new asset category (Admin/Asset Manager only)"""
    if current_user.get("role") != "Admin":

        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin or Asset Manager can create categories"
        )
    
    return category_service.create_category(request.category_name, request.description)

