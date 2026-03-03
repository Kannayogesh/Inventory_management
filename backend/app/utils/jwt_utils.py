# Praveen Hari 
# JWT utility functions for token generation and verification

from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.security import ALGORITHM

def decode_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id: str = payload.get("user_id")
        email: str = payload.get("email")
        role: str = payload.get("role")

        if user_id is None or email is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        return {"user_id": user_id, "email": email, "role": role}

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired"
        )
