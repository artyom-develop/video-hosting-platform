from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import Stream, Channel, User, StreamView
from app.schemas.schemas import StreamCreate, StreamResponse, StreamUpdate, StreamStatus, StreamWithUserResponse
import logging
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/streams", tags=["streams"])

# Upload directories
UPLOAD_DIR = Path("uploads")
STREAMS_DIR = UPLOAD_DIR / "streams"
STREAMS_DIR.mkdir(parents=True, exist_ok=True)

@router.get("", response_model=list[StreamWithUserResponse])
async def get_streams(
    channel_id: int = None,
    is_live: bool = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get streams with optional filtering"""
    
    logger.info(f"Getting streams: channel_id={channel_id}, is_live={is_live}, skip={skip}, limit={limit}")
    
    query = db.query(Stream).join(Channel).join(User)
    
    if channel_id:
        query = query.filter(Stream.channel_id == channel_id)
    
    if is_live is not None:
        query = query.filter(Stream.is_live == is_live)
    
    streams = query.order_by(Stream.created_at.desc()).offset(skip).limit(limit).all()
    logger.info(f"Found {len(streams)} streams")
    
    # Convert to response with user info
    result = []
    for stream in streams:
        stream_dict = {
            "id": stream.id,
            "channel_id": stream.channel_id,
            "title": stream.title,
            "description": stream.description,
            "thumbnail_url": stream.thumbnail_url,
            "cover_image_url": stream.cover_image_url,
            "duration": stream.duration,
            "is_live": stream.is_live,
            "is_archived": stream.is_archived,
            "view_count": stream.view_count,
            "started_at": stream.started_at,
            "ended_at": stream.ended_at,
            "created_at": stream.created_at,
            "updated_at": stream.updated_at,
            "creator_name": stream.channel.user.full_name or stream.channel.user.username,
            "profile_image": stream.channel.user.avatar_url
        }
        result.append(stream_dict)
    
    return result

@router.get("/{stream_id}", response_model=StreamResponse)
async def get_stream(stream_id: int, db: Session = Depends(get_db)):
    """Get stream by ID"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    return stream

@router.post("/{channel_id}", response_model=StreamResponse)
async def create_stream(
    channel_id: int,
    title: str = Form(...),
    description: str = Form(None),
    thumbnail: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Create a new stream for channel"""
    
    logger.info(f"Creating stream: channel_id={channel_id}, title={title}, description={description}, thumbnail={thumbnail.filename if thumbnail else None}")
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # Handle thumbnail upload
    thumbnail_url = None
    if thumbnail:
        logger.info(f"Saving thumbnail: {thumbnail.filename}")
        # Save thumbnail file
        file_extension = thumbnail.filename.split('.')[-1] if '.' in thumbnail.filename else 'jpg'
        filename = f"stream_{channel_id}_{int(datetime.utcnow().timestamp())}.{file_extension}"
        file_path = STREAMS_DIR / filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(thumbnail.file, buffer)
        
        thumbnail_url = f"/uploads/streams/{filename}"
        logger.info(f"Thumbnail saved: {thumbnail_url}")
    
    # Create stream
    db_stream = Stream(
        channel_id=channel_id,
        title=title,
        description=description,
        thumbnail_url=thumbnail_url,
        is_live=False,
        is_archived=False
    )
    
    db.add(db_stream)
    db.commit()
    db.refresh(db_stream)
    
    logger.info(f"Stream created: {db_stream.id} - {db_stream.title} with thumbnail: {thumbnail_url}")
    
    return db_stream

@router.put("/{stream_id}", response_model=StreamResponse)
async def update_stream(
    stream_id: int,
    stream_data: StreamUpdate,
    db: Session = Depends(get_db)
):
    """Update stream information"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    if stream_data.title is not None:
        stream.title = stream_data.title
    if stream_data.description is not None:
        stream.description = stream_data.description
    if stream_data.cover_image_url is not None:
        stream.cover_image_url = stream_data.cover_image_url
    
    db.commit()
    db.refresh(stream)
    
    return stream

@router.post("/{stream_id}/start", response_model=StreamStatus)
async def start_stream(stream_id: int, db: Session = Depends(get_db)):
    """Start streaming for a stream"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    if stream.is_live:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stream is already live"
        )
    
    stream.is_live = True
    stream.started_at = datetime.utcnow()
    stream.channel.is_live = True
    
    db.commit()
    
    logger.info(f"Stream started: {stream_id}")
    
    return {
        "stream_id": stream.id,
        "is_live": stream.is_live,
        "viewers_count": stream.channel.viewers_count,
        "duration": 0,
        "started_at": stream.started_at
    }

@router.post("/{stream_id}/stop", response_model=StreamStatus)
async def stop_stream(stream_id: int, db: Session = Depends(get_db)):
    """Stop streaming for a stream"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    if not stream.is_live:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stream is not live"
        )
    
    stream.is_live = False
    stream.ended_at = datetime.utcnow()
    stream.is_archived = True
    
    if stream.started_at:
        duration = (stream.ended_at - stream.started_at).total_seconds()
        stream.duration = int(duration)
    
    # Update channel
    stream.channel.is_live = False
    
    db.commit()
    
    logger.info(f"Stream stopped: {stream_id}")
    
    return {
        "stream_id": stream.id,
        "is_live": stream.is_live,
        "viewers_count": stream.channel.viewers_count,
        "duration": stream.duration,
        "started_at": stream.started_at
    }

@router.get("/{stream_id}/status", response_model=StreamStatus)
async def get_stream_status(stream_id: int, db: Session = Depends(get_db)):
    """Get current stream status"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    duration = 0
    if stream.started_at:
        if stream.is_live:
            duration = int((datetime.utcnow() - stream.started_at).total_seconds())
        else:
            duration = stream.duration
    
    return {
        "stream_id": stream.id,
        "is_live": stream.is_live,
        "viewers_count": stream.channel.viewers_count,
        "duration": duration,
        "started_at": stream.started_at
    }

@router.post("/{stream_id}/views")
async def increment_view_count(stream_id: int, db: Session = Depends(get_db)):
    """Record a stream view"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    # Create view record
    view = StreamView(stream_id=stream_id)
    db.add(view)
    stream.view_count += 1
    db.commit()
    
    return {"message": "View recorded", "view_count": stream.view_count}

@router.delete("/{stream_id}")
async def delete_stream(stream_id: int, db: Session = Depends(get_db)):
    """Delete a stream"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    db.delete(stream)
    db.commit()
    
    logger.info(f"Stream deleted: {stream_id}")
    
    return {"message": "Stream deleted successfully"}
