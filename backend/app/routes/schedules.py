from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.security import verify_token
from app.models.models import Schedule, Channel, User
from app.schemas.schemas import ScheduleCreate, ScheduleUpdate, ScheduleResponse
import logging

logger = logging.getLogger(__name__)

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

router = APIRouter(prefix="/api/schedules", tags=["schedules"])

# Create schedule
@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify that the channel belongs to the current user
    channel = db.query(Channel).filter(Channel.id == schedule_data.channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if channel.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create schedules for this channel")
    
    # Validate that scheduled_at is in the future
    if schedule_data.scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")
    
    # Create new schedule
    db_schedule = Schedule(
        channel_id=schedule_data.channel_id,
        title=schedule_data.title,
        description=schedule_data.description,
        scheduled_at=schedule_data.scheduled_at
    )
    
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    return db_schedule

# Get schedules for a channel
@router.get("/channel/{channel_id}", response_model=list[ScheduleResponse])
async def get_channel_schedules(
    channel_id: int,
    db: Session = Depends(get_db)
):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    schedules = db.query(Schedule).filter(
        Schedule.channel_id == channel_id
    ).order_by(Schedule.scheduled_at).all()
    
    return schedules

# Get schedule by ID
@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    return schedule

# Update schedule
@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Verify ownership
    channel = db.query(Channel).filter(Channel.id == schedule.channel_id).first()
    if channel.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this schedule")
    
    # Validate future date if scheduled_at is being updated
    if schedule_data.scheduled_at and schedule_data.scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")
    
    # Update fields
    if schedule_data.title:
        schedule.title = schedule_data.title
    if schedule_data.description is not None:
        schedule.description = schedule_data.description
    if schedule_data.scheduled_at:
        schedule.scheduled_at = schedule_data.scheduled_at
    
    schedule.updated_at = datetime.utcnow()
    
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    
    return schedule

# Delete schedule
@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Verify ownership
    channel = db.query(Channel).filter(Channel.id == schedule.channel_id).first()
    if channel.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this schedule")
    
    db.delete(schedule)
    db.commit()
    
    return None

# Get upcoming schedules for user's channels
@router.get("/user/upcoming", response_model=list[ScheduleResponse])
async def get_upcoming_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get all user's channels
    channels = db.query(Channel).filter(Channel.user_id == current_user.id).all()
    channel_ids = [ch.id for ch in channels]
    
    if not channel_ids:
        return []
    
    # Get upcoming schedules
    schedules = db.query(Schedule).filter(
        Schedule.channel_id.in_(channel_ids),
        Schedule.scheduled_at > datetime.utcnow()
    ).order_by(Schedule.scheduled_at).all()
    
    return schedules
