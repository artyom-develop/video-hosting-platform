from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import secrets
from app.core.database import get_db
from app.models.models import Channel, User, Stream
from app.schemas.schemas import ChannelCreate, ChannelResponse, ChannelUpdate
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/channels", tags=["channels"])

def generate_stream_key() -> str:
    """Generate unique stream key for channel"""
    return secrets.token_urlsafe(32)

@router.get("", response_model=list[ChannelResponse])
async def get_channels(
    skip: int = 0,
    limit: int = 20,
    is_live: bool = None,
    db: Session = Depends(get_db)
):
    """Get all channels with optional filtering"""
    
    query = db.query(Channel)
    
    if is_live is not None:
        query = query.filter(Channel.is_live == is_live)
    
    channels = query.offset(skip).limit(limit).all()
    
    return channels

@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(channel_id: int, db: Session = Depends(get_db)):
    """Get channel by ID"""
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    return channel

@router.post("", response_model=ChannelResponse)
async def create_channel(
    channel_data: ChannelCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Create a new channel (requires authentication)"""
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create channel
    db_channel = Channel(
        user_id=user_id,
        title=channel_data.title,
        description=channel_data.description,
        thumbnail_url=channel_data.thumbnail_url,
        stream_key=generate_stream_key()
    )
    
    db.add(db_channel)
    db.commit()
    db.refresh(db_channel)
    
    logger.info(f"Channel created: {db_channel.title} by user {user_id}")
    
    return db_channel

@router.put("/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    channel_id: int,
    channel_data: ChannelUpdate,
    db: Session = Depends(get_db)
):
    """Update channel information"""
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # Update fields
    if channel_data.title is not None:
        channel.title = channel_data.title
    if channel_data.description is not None:
        channel.description = channel_data.description
    if channel_data.thumbnail_url is not None:
        channel.thumbnail_url = channel_data.thumbnail_url
    
    db.commit()
    db.refresh(channel)
    
    return channel

@router.delete("/{channel_id}")
async def delete_channel(channel_id: int, db: Session = Depends(get_db)):
    """Delete a channel"""
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    db.delete(channel)
    db.commit()
    
    logger.info(f"Channel deleted: {channel_id}")
    
    return {"message": "Channel deleted successfully"}

@router.get("/{channel_id}/stream-key")
async def get_stream_key(channel_id: int, user_id: int, db: Session = Depends(get_db)):
    """Get stream key (only owner can access)"""
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    if channel.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this stream key"
        )
    
    return {"stream_key": channel.stream_key}

@router.post("/{channel_id}/regenerate-stream-key")
async def regenerate_stream_key(
    channel_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Regenerate stream key (only owner can access)"""
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    if channel.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    channel.stream_key = generate_stream_key()
    db.commit()
    db.refresh(channel)
    
    logger.info(f"Stream key regenerated for channel {channel_id}")
    
    return {"stream_key": channel.stream_key}
