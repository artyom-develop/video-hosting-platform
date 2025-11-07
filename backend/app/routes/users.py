from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Channel
from app.schemas.schemas import UserResponse, UserUpdate
from app.core.security import verify_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user profile"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):
    """Update user profile"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.avatar_url is not None:
        user.avatar_url = user_data.avatar_url
    if user_data.bio is not None:
        user.bio = user_data.bio
    
    db.commit()
    db.refresh(user)
    
    return user

@router.get("/{user_id}/channels", response_model=list)
async def get_user_channels(user_id: int, db: Session = Depends(get_db)):
    """Get all channels for user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    channels = db.query(Channel).filter(Channel.user_id == user_id).all()
    
    return channels

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete user account (requires authentication)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    logger.info(f"User deleted: {user_id}")
    
    return {"message": "User account deleted successfully"}
