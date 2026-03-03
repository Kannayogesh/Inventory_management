

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.jwt_utils import decode_access_token

security = HTTPBearer()


# =========================================================
# GET CURRENT USER FROM TOKEN
# =========================================================
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Extract user information from JWT token.
    Raises 401 if token is invalid or missing.
    """

    token = credentials.credentials

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or expired token"
        )

    return payload


# =========================================================
# ROLE CHECK FUNCTION
# =========================================================
def require_role(allowed_roles: list):
    """
    Dependency factory to check if current user's role is in allowed roles.
    Raises 403 if not allowed.
    """
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")

        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Role not found in token"
            )

        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have permission to access this resource"
            )

        return current_user

    return role_checker