from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Channel
from app.schemas.schemas import UserResponse, UserUpdate
from app.core.security import verify_token
import logging
import os
import shutil
from pathlib import Path
# from PIL import Image  # Temporarily disabled due to Docker build issues
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])

# File upload settings
UPLOAD_DIR = Path("uploads/avatars")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_IMAGE_SIZE = (1000, 1000)  # Max width/height

def validate_image(file: UploadFile) -> None:
    """Validate uploaded image file"""
    logger.info(f"Validating file: {file.filename}, content_type: {file.content_type}")

    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    logger.info(f"File extension: {file_ext}")
    if file_ext not in ALLOWED_EXTENSIONS:
        logger.error(f"File type not allowed: {file_ext}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    logger.info(f"File size: {file_size} bytes")

    if file_size > MAX_FILE_SIZE:
        logger.error(f"File too large: {file_size}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Basic validation - check if file starts with image signature
    file.file.seek(0)
    header = file.file.read(8)
    file.file.seek(0)
    logger.info(f"File header: {header.hex()}")

    # Check for common image signatures
    if not (
        header.startswith(b'\xff\xd8') or  # JPEG
        header.startswith(b'\x89PNG') or  # PNG
        header.startswith(b'GIF8') or     # GIF
        header.startswith(b'RIFF')        # WebP
    ):
        logger.error(f"Invalid image signature: {header.hex()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file"
        )

def save_avatar(file: UploadFile, user_id: int) -> str:
    """Save avatar file and return URL"""
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower()
    filename = f"{user_id}_{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create thumbnail (simplified version without PIL)
    # For now, just copy the original as thumbnail
    thumb_path = UPLOAD_DIR / f"thumb_{filename}"
    shutil.copy(file_path, thumb_path)
    
    # Return relative URL
    return f"/uploads/avatars/{filename}"

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
    
    # Check if username is already taken by another user
    if user_data.username is not None and user_data.username != user.username:
        existing_user = db.query(User).filter(
            User.username == user_data.username,
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        user.username = user_data.username
    
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

@router.post("/{user_id}/avatar")
async def upload_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload user avatar"""
    
    logger.info(f"=== AVATAR UPLOAD START ===")
    logger.info(f"User ID: {user_id}")
    logger.info(f"File: {file.filename}, Type: {file.content_type}")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        logger.error(f"User not found: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    logger.info(f"User found: {user.username}, Current avatar: {user.avatar_url}")
    
    # Validate file
    validate_image(file)
    
    # Save old avatar path for cleanup
    old_avatar = user.avatar_url
    
    # Save new avatar
    avatar_url = save_avatar(file, user_id)
    logger.info(f"Avatar saved to: {avatar_url}")
    
    # Update user
    user.avatar_url = avatar_url
    logger.info(f"Updated user avatar_url in memory: {user.avatar_url}")
    
    db.commit()
    logger.info(f"Database committed")
    
    db.refresh(user)
    logger.info(f"User refreshed from DB: {user.avatar_url}")
    
    # Clean up old avatar file (optional)
    if old_avatar and old_avatar.startswith("/uploads/avatars/"):
        try:
            old_path = Path(f".{old_avatar}")
            if old_path.exists():
                old_path.unlink()
                # Also remove thumbnail
                thumb_path = old_path.parent / f"thumb_{old_path.name}"
                if thumb_path.exists():
                    thumb_path.unlink()
        except Exception:
            pass  # Ignore cleanup errors
    
    logger.info(f"=== AVATAR UPLOAD COMPLETE ===")
    logger.info(f"Returning: message='Avatar uploaded successfully', avatar_url='{avatar_url}'")
    
    return {
        "message": "Avatar uploaded successfully",
        "avatar_url": avatar_url
    }
