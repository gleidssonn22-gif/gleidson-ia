from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def get_current_user_profile():
    return {
        "status": "active",
        "name": "Gleidson Pereira",
        "project": "clube-wins"
    }