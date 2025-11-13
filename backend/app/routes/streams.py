from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import Stream, Channel, User, StreamView, Subscription
from app.schemas.schemas import StreamCreate, StreamResponse, StreamUpdate, StreamStatus, StreamWithUserResponse
import logging
import shutil
from pathlib import Path
import html

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/streams", tags=["streams"])

# Upload directories
UPLOAD_DIR = Path("uploads")
STREAMS_DIR = UPLOAD_DIR / "streams"
STREAMS_DIR.mkdir(parents=True, exist_ok=True)

def sanitize_text(text: str) -> str:
    """Sanitize user input to prevent XSS attacks"""
    if not text:
        return text
    # Escape HTML special characters
    return html.escape(text)

@router.get("", response_model=list[StreamWithUserResponse])
async def get_streams(
    channel_id: int = None,
    is_live: bool = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get streams with optional filtering - shows only live streams for public listing"""
    
    logger.info(f"Getting streams: channel_id={channel_id}, is_live={is_live}, skip={skip}, limit={limit}")
    
    query = db.query(Stream).join(Channel).join(User)
    
    if channel_id:
        query = query.filter(Stream.channel_id == channel_id)
    
    # По умолчанию показываем только активные стримы (когда идёт HLS поток)
    if is_live is not None:
        query = query.filter(Stream.is_live == is_live)
    else:
        # Если не указано явно, показываем только живые стримы
        query = query.filter(Stream.is_live == True)
    
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
            "profile_image": stream.channel.user.avatar_url,
            "channel": {
                "id": stream.channel.id,
                "user_id": stream.channel.user_id,
                "username": stream.channel.user.username,
                "avatar": stream.channel.user.avatar_url,
                "bio": stream.channel.user.bio,
                "stream_key": stream.channel.stream_key,
                "is_live": stream.channel.is_live,
                "viewers_count": stream.channel.viewers_count
            }
        }
        result.append(stream_dict)
    
    return result

@router.get("/channel/{channel_id}/all", response_model=list[StreamWithUserResponse])
async def get_all_channel_streams(
    channel_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get all streams for a channel (including non-live) - for profile page"""
    
    logger.info(f"Getting all streams for channel: {channel_id}, skip={skip}, limit={limit}")
    
    query = db.query(Stream).filter(Stream.channel_id == channel_id).order_by(Stream.created_at.desc())
    
    streams = query.offset(skip).limit(limit).all()
    logger.info(f"Found {len(streams)} streams for channel {channel_id}")
    
    # Convert to response with user info
    result = []
    for stream in streams:
        # Get channel and user info
        channel = db.query(Channel).filter(Channel.id == stream.channel_id).first()
        if not channel:
            continue
        
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
            "creator_name": channel.user.full_name or channel.user.username,
            "profile_image": channel.user.avatar_url,
            "channel": {
                "id": channel.id,
                "user_id": channel.user_id,
                "username": channel.user.username,
                "avatar": channel.user.avatar_url,
                "bio": channel.user.bio,
                "stream_key": channel.stream_key,
                "is_live": channel.is_live,
                "viewers_count": channel.viewers_count
            }
        }
        result.append(stream_dict)
    
    return result

@router.get("/user/{user_id}/videos", response_model=list[StreamWithUserResponse])
async def get_user_videos(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get all archived videos for a user"""
    
    logger.info(f"Getting videos for user: {user_id}, skip={skip}, limit={limit}")
    
    # Get user's channel
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    channel = db.query(Channel).filter(Channel.user_id == user_id).first()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # Get archived videos (uploaded videos)
    streams = db.query(Stream).filter(
        Stream.channel_id == channel.id,
        Stream.is_archived == True
    ).order_by(Stream.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for stream in streams:
        # Get subscribers count
        subscribers_count = db.query(func.count(Subscription.id)).filter(
            Subscription.channel_id == stream.channel.id
        ).scalar() or 0
        
        stream_dict = {
            "id": stream.id,
            "channel_id": stream.channel_id,
            "title": stream.title,
            "description": stream.description,
            "thumbnail_url": stream.thumbnail_url,
            "video_url": stream.video_url,
            "cover_image_url": stream.cover_image_url,
            "duration": stream.duration or 0,
            "view_count": stream.view_count or 0,
            "started_at": stream.started_at,
            "ended_at": stream.ended_at,
            "stream_key": stream.channel.stream_key,
            "is_live": stream.is_live,
            "is_archived": stream.is_archived,
            "created_at": stream.created_at.isoformat() if stream.created_at else None,
            "updated_at": stream.updated_at.isoformat() if stream.updated_at else None,
            "user": {
                "id": stream.channel.user.id,
                "username": stream.channel.user.username,
                "full_name": stream.channel.user.full_name,
                "avatar_url": stream.channel.user.avatar_url,
                "bio": stream.channel.user.bio,
                "email": stream.channel.user.email,
                "is_active": stream.channel.user.is_active,
                "subscribers_count": subscribers_count
            },
            "creator_name": stream.channel.user.full_name or stream.channel.user.username,
            "profile_image": stream.channel.user.avatar_url,
            "channel": {
                "id": stream.channel.id,
                "user_id": stream.channel.user_id,
                "username": stream.channel.user.username,
                "avatar": stream.channel.user.avatar_url,
                "bio": stream.channel.user.bio,
                "stream_key": stream.channel.stream_key,
                "is_live": stream.channel.is_live,
                "viewers_count": stream.channel.viewers_count
            }
        }
        result.append(stream_dict)
    
    return result

@router.get("/by-key/{stream_key}", response_model=StreamWithUserResponse)
async def get_stream_by_key(stream_key: str, response: Response, db: Session = Depends(get_db)):
    """Get stream by stream key (from channel)"""
    
    # Добавляем заголовки для отключения кеширования
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    logger.info(f"Getting stream by key: {stream_key}")
    
    # Find channel by stream_key
    channel = db.query(Channel).filter(Channel.stream_key == stream_key).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    # Get the latest stream for this channel that is currently live (HLS поток активен)
    stream = db.query(Stream).filter(
        Stream.channel_id == channel.id,
        Stream.is_live == True
    ).order_by(Stream.created_at.desc()).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream is not currently live. Please try again later."
        )
    
    # Build response with channel info
    response = {
        "id": stream.id,
        "channel_id": stream.channel_id,
        "title": stream.title,
        "description": stream.description,
        "thumbnail_url": stream.thumbnail_url,
        "cover_image_url": stream.cover_image_url,
        "duration": stream.duration,
        "started_at": stream.started_at,
        "ended_at": stream.ended_at,
        "is_live": stream.is_live,
        "is_archived": stream.is_archived,
        "view_count": stream.view_count,
        "created_at": stream.created_at,
        "updated_at": stream.updated_at,
        "channel": {
            "id": channel.id,
            "user_id": channel.user_id,
            "username": channel.user.username,
            "avatar": channel.user.avatar_url,
            "bio": channel.user.bio,
            "stream_key": channel.stream_key,
            "is_live": channel.is_live,
            "viewers_count": channel.viewers_count
        }
    }
    
    return response

@router.get("/{stream_id}", response_model=StreamWithUserResponse)
async def get_stream(stream_id: int, db: Session = Depends(get_db)):
    """Get stream by ID"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    # Build response with channel information
    channel = stream.channel
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # Get subscribers count
    subscribers_count = db.query(func.count(Subscription.id)).filter(
        Subscription.channel_id == channel.id
    ).scalar() or 0
    
    # Build response dict
    response_dict = {
        "id": stream.id,
        "channel_id": stream.channel_id,
        "title": stream.title,
        "description": stream.description,
        "thumbnail_url": stream.thumbnail_url,
        "video_url": stream.video_url,
        "cover_image_url": stream.cover_image_url,
        "duration": stream.duration or 0,
        "is_live": stream.is_live,
        "is_archived": stream.is_archived,
        "view_count": stream.view_count or 0,
        "started_at": stream.started_at,
        "ended_at": stream.ended_at,
        "created_at": stream.created_at,
        "updated_at": stream.updated_at,
        "creator_name": channel.user.full_name or channel.user.username,
        "profile_image": channel.user.avatar_url,
        "channel": {
            "id": channel.id,
            "user_id": channel.user_id,
            "username": channel.user.username,
            "avatar": channel.user.avatar_url,
            "bio": channel.user.bio,
            "stream_key": channel.stream_key,
            "is_live": channel.is_live,
            "viewers_count": channel.viewers_count
        },
        "user": {
            "id": channel.user.id,
            "username": channel.user.username,
            "email": channel.user.email,
            "full_name": channel.user.full_name,
            "avatar_url": channel.user.avatar_url,
            "bio": channel.user.bio,
            "is_active": channel.user.is_active,
            "subscribers_count": subscribers_count,
            "created_at": channel.user.created_at
        },
        "user_id": channel.user_id
    }
    
    return response_dict

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
        title=sanitize_text(title),
        description=sanitize_text(description) if description else None,
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
    title: str = Form(None),
    description: str = Form(None),
    thumbnail: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Update stream information"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )
    
    # Update title if provided
    if title is not None:
        stream.title = sanitize_text(title)
    
    # Update description if provided
    if description is not None:
        stream.description = sanitize_text(description) if description else None
    
    # Handle thumbnail upload if provided
    if thumbnail:
        logger.info(f"Updating thumbnail for stream {stream_id}: {thumbnail.filename}")
        # Save thumbnail file
        file_extension = thumbnail.filename.split('.')[-1] if '.' in thumbnail.filename else 'jpg'
        filename = f"stream_{stream_id}_{int(datetime.utcnow().timestamp())}.{file_extension}"
        file_path = STREAMS_DIR / filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(thumbnail.file, buffer)
        
        stream.thumbnail_url = f"/uploads/streams/{filename}"
        logger.info(f"Thumbnail updated: {stream.thumbnail_url}")
    
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

@router.post("/{channel_id}/upload-video", response_model=StreamResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    channel_id: int,
    title: str = Form(...),
    description: str = Form(default=""),
    video: UploadFile = File(...),
    thumbnail: UploadFile = File(default=None),
    db: Session = Depends(get_db)
):
    """Upload a video"""
    
    logger.info(f"Uploading video: title={title}, channel_id={channel_id}, video_name={video.filename if video else None}")
    
    try:
        # Validate inputs
        if not title or len(title) > 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title must be between 1 and 200 characters"
            )
        
        if len(description) > 5000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Description must not exceed 5000 characters"
            )
        
        # Check if channel exists
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel not found"
            )
        
        # Validate video file
        if not video:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Video file is required"
            )
        
        # Check video size (max 500MB)
        video_size = 0
        video_data = await video.read()
        video_size = len(video_data)
        
        if video_size > 500 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Video size must not exceed 500MB"
            )
        
        # Check video format
        valid_video_types = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
        if video.content_type not in valid_video_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only MP4, WebM, MOV, and AVI formats are supported"
            )
        
        # Save video file
        video_filename = f"{datetime.utcnow().timestamp()}_{video.filename}"
        video_path = STREAMS_DIR / video_filename
        
        with open(video_path, "wb") as f:
            f.write(video_data)
        
        # Handle thumbnail
        thumbnail_filename = None
        if thumbnail:
            # Check thumbnail size (max 10MB)
            thumbnail_data = await thumbnail.read()
            if len(thumbnail_data) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Thumbnail size must not exceed 10MB"
                )
            
            # Check thumbnail format
            if thumbnail.content_type not in ['image/jpeg', 'image/png', 'image/webp']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Thumbnail must be JPG, PNG, or WebP format"
                )
            
            thumbnail_filename = f"thumb_{datetime.utcnow().timestamp()}_{thumbnail.filename}"
            thumbnail_path = STREAMS_DIR / thumbnail_filename
            
            with open(thumbnail_path, "wb") as f:
                f.write(thumbnail_data)
        
        # Create stream record
        stream = Stream(
            channel_id=channel_id,
            title=sanitize_text(title),
            description=sanitize_text(description),
            video_url=f"/uploads/streams/{video_filename}",
            thumbnail_url=f"/uploads/streams/{thumbnail_filename}" if thumbnail_filename else None,
            is_live=False,
            is_archived=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(stream)
        db.commit()
        db.refresh(stream)
        
        logger.info(f"Video uploaded successfully: {stream.id}")
        
        return stream
        
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Error uploading video: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload video"
        )

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

@router.post("/{stream_id}/view")
async def increment_view_count(
    stream_id: int,
    db: Session = Depends(get_db)
):
    """Increment view count for a video"""
    
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Increment view count
    stream.view_count = (stream.view_count or 0) + 1
    stream.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(stream)
    
    logger.info(f"View count incremented for stream {stream_id}: {stream.view_count}")
    
    return {"view_count": stream.view_count}
