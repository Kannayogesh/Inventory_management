
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.schemas.auth_schema import RegisterRequest, LoginRequest, UpdateUserRequest
from app.services.auth_service import register_user, login_user
from app.repositories.user_repository import get_user_count, get_all_users, get_user_by_id, search_users, update_user
from app.middleware.role_middleware import get_current_user
from typing import List

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


@router.post("/register")
def register(request: RegisterRequest, current_user: dict = Depends(get_current_user)):
    user_count = get_user_count()

    # If users exist, we must verify the requester is an Admin
    if user_count > 0:
        if current_user.get("role") != "Admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only Admins can register new users."
            )

    return register_user(request)


@router.post("/login")
def login(request: LoginRequest):
    return login_user(request)


@router.get("/users")
def get_users(current_user: dict = Depends(get_current_user)):
    """Get all active users (requires authentication)"""
    users = get_all_users("Active")
    return users


@router.get("/users/search")
def search_users_endpoint(q: str, current_user: dict = Depends(get_current_user)):
    """Search users by name, email, or employee code (requires authentication)"""
    if not q or len(q) < 1:
        return []
    
    users = search_users(q)
    return users


@router.get("/users/{user_id}")
def get_user(user_id: int, current_user: dict = Depends(get_current_user)):
    """Get a single user by ID (requires authentication)"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/users/{user_id}")
def update_user_endpoint(
    user_id: int,
    request: UpdateUserRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user information (Admin only)"""
    # Verify user is Admin
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Admins can update user information"
        )
    
    # Get the user to verify it exists
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Build update dictionary with non-null values
    updates = {}
    for field in ["full_name", "email", "phone", "role", "designation", "department", "location", "status", "joining_date"]:
        value = getattr(request, field, None)
        if value is not None:
            updates[field] = value
    
    if not updates:
        return user
    
    success = update_user(user_id, updates)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user"
        )
    
    # Return updated user
    return get_user_by_id(user_id)

