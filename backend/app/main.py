from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.exceptions import http_exception_handler, validation_exception_handler
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.controllers.auth_controller import router as auth_router
from app.controllers.asset_controller import router as asset_router
from app.controllers.assignment_controller import router as assignment_router
from app.controllers.maintenance_controller import router as maintenance_router
from app.controllers.procurement_controller import router as procurement_router
from app.controllers.category_controller import router as category_router

from app.repositories.user_repository import get_user_count, create_user
from app.core.security import hash_password
from app.repositories.category_repository import get_category_count, create_category

app = FastAPI(
    title="Inventory Management System",
    version="1.0.1"
)

@app.on_event("startup")
def startup_event():
    # Ensure uploads directory exists
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
        
    try:
        if get_user_count() == 0:
            create_user(
                employee_code="ADMIN-001",
                full_name="System Administrator",
                email="admin@admin.com",
                password=hash_password("admin123"),
                role="Admin"
            )
            print("Successfully seeded initial Admin user -> admin@admin.com : admin123")
            
        if get_category_count() == 0:
            default_categories = ["Laptops", "Desktops", "Monitors", "Networking", "Accessories", "Software"]
            for cat in default_categories:
                create_category(category_name=cat)
            print(f"Successfully seeded {len(default_categories)} default categories.")
    except Exception as e:
        print(f"Error during startup seeding: {e}")

# CORS (allows React frontend + analytics page to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "null",  # file:// opened pages
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Register exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(asset_router, prefix="/api")
app.include_router(assignment_router, prefix="/api")
app.include_router(maintenance_router, prefix="/api")
app.include_router(procurement_router, prefix="/api")
app.include_router(category_router, prefix="/api")