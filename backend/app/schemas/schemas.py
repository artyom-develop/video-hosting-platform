from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str]
    bio: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Channel schemas
class ChannelBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None

class ChannelCreate(ChannelBase):
    pass

class ChannelUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None

class ChannelResponse(ChannelBase):
    id: int
    user_id: int
    stream_key: str
    is_live: bool
    viewers_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Stream schemas
class StreamBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None

class StreamCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None

class StreamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None

class StreamResponse(StreamBase):
    id: int
    channel_id: int
    thumbnail_url: Optional[str]
    cover_image_url: Optional[str]
    duration: int
    is_live: bool
    is_archived: bool
    view_count: int
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class ChannelInfo(BaseModel):
    id: int
    user_id: int
    username: str
    avatar: Optional[str]
    bio: Optional[str]
    stream_key: str
    is_live: bool
    viewers_count: int

    class Config:
        from_attributes = True

class StreamWithUserResponse(StreamResponse):
    creator_name: Optional[str] = None
    profile_image: Optional[str] = None
    channel: Optional[ChannelInfo] = None

    class Config:
        from_attributes = True

# Stream View schema
class StreamViewResponse(BaseModel):
    id: int
    stream_id: int
    user_id: Optional[int]
    watch_duration: int
    started_at: datetime
    ended_at: Optional[datetime]

    class Config:
        from_attributes = True

# Statistics schema
class StatisticResponse(BaseModel):
    id: int
    channel_id: int
    date: str
    total_views: int
    unique_viewers: int
    avg_watch_time: float

    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

# Document schema
class DocumentResponse(BaseModel):
    id: int
    slug: str
    title: str
    content: str
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Stream status
class StreamStatus(BaseModel):
    stream_id: int
    is_live: bool
    viewers_count: int
    duration: int
    started_at: Optional[datetime]

# Channel stats
class ChannelStats(BaseModel):
    total_views: int
    unique_viewers: int
    avg_watch_time: float
    active_streams: int

# Subscription schemas
class SubscriptionResponse(BaseModel):
    id: int
    subscriber_id: int
    channel_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SubscribedChannelResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    thumbnail_url: Optional[str]
    is_live: bool
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

# Schedule schemas
class ScheduleCreate(BaseModel):
    channel_id: int
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    scheduled_at: datetime

class ScheduleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    scheduled_at: Optional[datetime] = None

class ScheduleResponse(BaseModel):
    id: int
    channel_id: int
    title: str
    description: Optional[str]
    scheduled_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
