from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Subscription, Channel, User
from app.schemas.schemas import SubscriptionResponse, SubscribedChannelResponse
from app.core.security import verify_token
from fastapi import Request
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

async def get_current_user_id(request: Request) -> int:
    """Get current user ID from JWT token"""
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
    
    return int(user_id)

@router.post("/{channel_id}", response_model=SubscriptionResponse)
async def subscribe_to_channel(
    channel_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Subscribe to a channel"""
    user_id = await get_current_user_id(request)
    
    # Check if channel exists
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # Check if already subscribed
    existing_subscription = db.query(Subscription).filter(
        Subscription.subscriber_id == user_id,
        Subscription.channel_id == channel_id
    ).first()
    
    if existing_subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to this channel"
        )
    
    # Create subscription
    subscription = Subscription(
        subscriber_id=user_id,
        channel_id=channel_id
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    return subscription

@router.delete("/{channel_id}")
async def unsubscribe_from_channel(
    channel_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Unsubscribe from a channel"""
    user_id = await get_current_user_id(request)
    
    # Find and delete subscription
    subscription = db.query(Subscription).filter(
        Subscription.subscriber_id == user_id,
        Subscription.channel_id == channel_id
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    db.delete(subscription)
    db.commit()
    
    return {"detail": "Unsubscribed successfully"}

@router.get("/user/subscriptions", response_model=list[SubscribedChannelResponse])
async def get_user_subscriptions(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all channels user is subscribed to"""
    user_id = await get_current_user_id(request)
    
    subscriptions = db.query(Subscription).filter(
        Subscription.subscriber_id == user_id
    ).all()
    
    channels = []
    for subscription in subscriptions:
        channel = db.query(Channel).filter(Channel.id == subscription.channel_id).first()
        if channel:
            channels.append(channel)
    
    return channels

@router.get("/{channel_id}/is-subscribed")
async def is_subscribed_to_channel(
    channel_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Check if user is subscribed to a channel"""
    user_id = await get_current_user_id(request)
    
    subscription = db.query(Subscription).filter(
        Subscription.subscriber_id == user_id,
        Subscription.channel_id == channel_id
    ).first()
    
    return {"is_subscribed": subscription is not None}

@router.get("/check/{user_id}")
async def check_subscription_by_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Check if current user is subscribed to a creator (by user_id)"""
    try:
        current_user_id = await get_current_user_id(request)
    except HTTPException:
        return {"subscribed": False}
    
    # Get user's channel
    channel = db.query(Channel).filter(Channel.user_id == user_id).first()
    if not channel:
        return {"subscribed": False}
    
    # Check subscription
    subscription = db.query(Subscription).filter(
        Subscription.subscriber_id == current_user_id,
        Subscription.channel_id == channel.id
    ).first()
    
    return {"subscribed": subscription is not None}
