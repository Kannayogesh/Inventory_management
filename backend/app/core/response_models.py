
from fastapi.responses import JSONResponse
from typing import Any, Optional
from pydantic import BaseModel

class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


def success_response(message: str, data: Any = None):
    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "message": message,
            "data": data
        }
    )


def error_response(message: str, status_code: int = 400):
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "error",
            "message": message,
            "data": None
        }
    )