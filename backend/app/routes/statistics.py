from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta, date
from app.core.database import get_db
from app.models.models import Channel, Stream, StreamView, Statistic
from app.schemas.schemas import StatisticResponse, ChannelStats
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/statistics", tags=["statistics"])

@router.get("/channel/{channel_id}", response_model=ChannelStats)
async def get_channel_stats(channel_id: int, db: Session = Depends(get_db)):
    """Get channel statistics"""
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # Get total views across all streams
    total_views = db.query(func.sum(Stream.view_count)).filter(
        Stream.channel_id == channel_id
    ).scalar() or 0
    
    # Get unique viewers
    unique_viewers = db.query(func.count(func.distinct(StreamView.user_id))).join(
        Stream
    ).filter(Stream.channel_id == channel_id).scalar() or 0
    
    # Get average watch time
    avg_watch_time = db.query(func.avg(StreamView.watch_duration)).join(
        Stream
    ).filter(Stream.channel_id == channel_id).scalar() or 0
    
    # Get active streams count
    active_streams = db.query(func.count(Stream.id)).filter(
        and_(Stream.channel_id == channel_id, Stream.is_live == True)
    ).scalar() or 0
    
    return {
        "total_views": int(total_views),
        "unique_viewers": int(unique_viewers),
        "avg_watch_time": float(avg_watch_time),
        "active_streams": int(active_streams)
    }

@router.get("/channel/{channel_id}/daily")
async def get_channel_daily_stats(
    channel_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get daily statistics for last N days"""
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # Get statistics for last N days
    start_date = date.today() - timedelta(days=days)
    
    stats = db.query(Statistic).filter(
        and_(
            Statistic.channel_id == channel_id,
            Statistic.date >= str(start_date)
        )
    ).order_by(Statistic.date).all()
    
    return stats

@router.get("/channel/{channel_id}/top-streams")
async def get_top_streams(
    channel_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get top streams by view count"""
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    streams = db.query(Stream).filter(
        Stream.channel_id == channel_id
    ).order_by(Stream.view_count.desc()).limit(limit).all()
    
    return streams

@router.post("/channel/{channel_id}/record-daily-stats")
async def record_daily_stats(channel_id: int, db: Session = Depends(get_db)):
    """Record daily statistics (usually called by scheduler)"""
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    today = str(date.today())
    
    # Check if stats already recorded for today
    existing_stat = db.query(Statistic).filter(
        and_(
            Statistic.channel_id == channel_id,
            Statistic.date == today
        )
    ).first()
    
    if existing_stat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stats already recorded for today"
        )
    
    # Calculate daily statistics
    total_views = db.query(func.sum(Stream.view_count)).filter(
        Stream.channel_id == channel_id
    ).scalar() or 0
    
    unique_viewers = db.query(func.count(func.distinct(StreamView.user_id))).join(
        Stream
    ).filter(Stream.channel_id == channel_id).scalar() or 0
    
    avg_watch_time = db.query(func.avg(StreamView.watch_duration)).join(
        Stream
    ).filter(Stream.channel_id == channel_id).scalar() or 0
    
    # Create statistic record
    statistic = Statistic(
        channel_id=channel_id,
        date=today,
        total_views=int(total_views),
        unique_viewers=int(unique_viewers),
        avg_watch_time=float(avg_watch_time) if avg_watch_time else 0.0
    )
    
    db.add(statistic)
    db.commit()
    
    logger.info(f"Daily stats recorded for channel {channel_id}")
    
    return statistic

@router.get("/user/{user_id}/overview")
async def get_user_overview(user_id: int, db: Session = Depends(get_db)):
    """Get overview statistics for user's channels"""
    
    # Get all user channels
    channels = db.query(Channel).filter(Channel.user_id == user_id).all()
    
    if not channels:
        return {
            "total_channels": 0,
            "total_views": 0,
            "active_channels": 0,
            "total_streams": 0
        }
    
    channel_ids = [ch.id for ch in channels]
    
    # Calculate aggregate stats
    total_views = db.query(func.sum(Stream.view_count)).filter(
        Stream.channel_id.in_(channel_ids)
    ).scalar() or 0
    
    active_channels = db.query(func.count(Channel.id)).filter(
        and_(
            Channel.user_id == user_id,
            Channel.is_live == True
        )
    ).scalar() or 0
    
    total_streams = db.query(func.count(Stream.id)).filter(
        Stream.channel_id.in_(channel_ids)
    ).scalar() or 0
    
    return {
        "total_channels": len(channels),
        "total_views": int(total_views),
        "active_channels": int(active_channels),
        "total_streams": int(total_streams)
    }
