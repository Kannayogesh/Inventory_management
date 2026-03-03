
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.schemas.auth_schema import RegisterRequest, LoginRequest
from app.services.auth_service import register_user, login_user
from app.repositories.user_repository import get_user_count
from app.utils.jwt_utils import decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


@router.post("/register")
def register(request: RegisterRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_count = get_user_count()

    # If users exist, we must authorize as an Admin
    if user_count > 0:
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated. An Admin token is required to register new users."
            )
        token = credentials.credentials
        payload = decode_access_token(token)
        if payload is None or payload.get("role") != "Admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only Admins can register new users."
            )

    return register_user(request)


@router.post("/login")
def login(request: LoginRequest):
    return login_user(request)
