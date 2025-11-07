from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    avatar_url = Column(String(500))
    bio = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    channels = relationship("Channel", back_populates="user", cascade="all, delete-orphan")
    stream_views = relationship("StreamView", back_populates="user")

class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    thumbnail_url = Column(String(500))
    stream_key = Column(String(255), unique=True, nullable=False)
    is_live = Column(Boolean, default=False, index=True)
    viewers_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="channels")
    streams = relationship("Stream", back_populates="channel", cascade="all, delete-orphan")
    statistics = relationship("Statistic", back_populates="channel", cascade="all, delete-orphan")

class Stream(Base):
    __tablename__ = "streams"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    thumbnail_url = Column(String(500))
    cover_image_url = Column(String(500))
    duration = Column(Integer, default=0)
    started_at = Column(DateTime)
    ended_at = Column(DateTime)
    is_live = Column(Boolean, default=False, index=True)
    is_archived = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    channel = relationship("Channel", back_populates="streams")
    views = relationship("StreamView", back_populates="stream", cascade="all, delete-orphan")

class StreamView(Base):
    __tablename__ = "stream_views"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer, ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String(255))
    watch_duration = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)

    # Relationships
    stream = relationship("Stream", back_populates="views")
    user = relationship("User", back_populates="stream_views")

class Statistic(Base):
    __tablename__ = "statistics"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    total_views = Column(Integer, default=0)
    unique_viewers = Column(Integer, default=0)
    avg_watch_time = Column(Float, default=0.0)

    # Relationships
    channel = relationship("Channel", back_populates="statistics")

    class Config:
        __table_args__ = (
            {'schema': None},  # Здесь можно добавить уникальные ограничения
        )

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
