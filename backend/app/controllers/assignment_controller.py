from fastapi import APIRouter, Depends, BackgroundTasks
from typing import List

from app.schemas.assignment_schema import AssignmentCreate, AssignmentUpdate, AssignmentResponse, ReturnRequest
from app.services import assignment_service
from app.middleware.role_middleware import get_current_user, require_role

router = APIRouter(prefix="/assignments", tags=["Asset Assignments"])

@router.get("/", response_model=List[AssignmentResponse])
def get_all_assignments(current_user: dict = Depends(get_current_user)):
    return assignment_service.get_assignments(current_user)

@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(assignment_id: int, current_user: dict = Depends(get_current_user)):
    return assignment_service.get_assignment(assignment_id)

@router.post("/", response_model=AssignmentResponse)
def create_assignment(
    assignment_data: AssignmentCreate, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(["Admin", "Asset Manager"]))
):
    return assignment_service.create_assignment(assignment_data, current_user, background_tasks)

@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int, 
    assignment_data: AssignmentUpdate, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(["Admin", "Asset Manager"]))
):
    return assignment_service.update_assignment(assignment_id, assignment_data, background_tasks)

@router.post("/{assignment_id}/remind")
def send_confirmation_reminder(
    assignment_id: int, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(["Admin", "Asset Manager"]))
):
    return assignment_service.send_confirmation_reminder(assignment_id, background_tasks)

@router.post("/{assignment_id}/return", response_model=AssignmentResponse)
def return_assignment(
    assignment_id: int, 
    return_data: ReturnRequest, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Allows a user to return an assigned asset.
    Employees can only return their own assignments. Admin/Asset Managers can return any.
    """
    return assignment_service.return_assignment(assignment_id, return_data, current_user, background_tasks)

