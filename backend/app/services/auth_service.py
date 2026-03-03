from fastapi import HTTPException, status
from app.repositories.user_repository import get_user_by_email, create_user
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


def register_user(request):
    existing_user = get_user_by_email(request.email)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    hashed = hash_password(request.password)

    create_user(
        employee_code=request.employee_code,
        full_name=request.full_name,
        email=request.email,
        password=hashed,
        role=request.role,
        phone=request.phone,
        designation=request.designation,
        department=request.department,
        location=request.location,
        joining_date=request.joining_date,
    )

    return {"message": "User registered successfully"}


def login_user(request):
    user = get_user_by_email(request.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token({
        "user_id": user["user_id"],
        "email": user["email"],
        "role": user["role"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "employee_code": user["employee_code"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "status": user["status"]
        }
    }