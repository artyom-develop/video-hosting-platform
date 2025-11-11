from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Stream, Channel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rtmp", tags=["rtmp"])

@router.post("/publish")
async def rtmp_publish(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    RTMP publish hook - вызывается когда стример начинает трансляцию
    """
    try:
        # Получаем данные от nginx-rtmp
        form_data = await request.form()
        logger.info(f"🔄 RTMP publish request: {dict(form_data)}")

        # Извлекаем параметры
        stream_key = form_data.get("name", "")
        app_name = form_data.get("app", "")
        client_ip = request.client.host if request.client else "unknown"

        logger.info(f"📡 Stream key: '{stream_key}', App: '{app_name}', IP: {client_ip}")

        if not stream_key:
            logger.warning("❌ No stream key provided")
            raise HTTPException(status_code=403, detail="Stream key required")

        # Ищем канал по stream key
        channel = db.query(Channel).filter(Channel.stream_key == stream_key).first()
        if not channel:
            logger.warning(f"❌ Invalid stream key: '{stream_key}' - not found in database")
            raise HTTPException(status_code=403, detail="Invalid stream key")

        # Получаем пользователя канала
        user = channel.user
        logger.info(f"✅ Stream authorized for user {user.username} (Channel ID: {channel.id})")

        # Ищем последний стрим канала (независимо от is_live статуса)
        stream = db.query(Stream).filter(
            Stream.channel_id == channel.id
        ).order_by(Stream.created_at.desc()).first()

        if not stream:
            # Создаем новый стрим если его вообще нет
            from datetime import datetime
            stream = Stream(
                channel_id=channel.id,
                title=f"Live Stream - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
                description="Live streaming session",
                is_live=True,
                created_at=datetime.utcnow()
            )
            db.add(stream)
            db.commit()
            db.refresh(stream)
            logger.info(f"📹 Created new live stream for channel {channel.id}")
        else:
            # Обновляем статус существующего стрима на is_live=True
            if not stream.is_live:
                stream.is_live = True
                db.commit()
                logger.info(f"📹 Updated existing stream {stream.id} to is_live=True")
            else:
                logger.info(f"📹 Stream {stream.id} already is_live=True")

        logger.info(f"✅ RTMP publish successful for user {user.username}, Stream ID: {stream.id}")
        return {"status": "ok"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RTMP publish error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/unpublish")
async def rtmp_unpublish(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    RTMP unpublish hook - вызывается когда стример заканчивает трансляцию
    """
    try:
        # Получаем данные от nginx-rtmp
        form_data = await request.form()
        logger.info(f"RTMP unpublish request: {dict(form_data)}")

        # Извлекаем параметры
        stream_key = form_data.get("name", "")
        app_name = form_data.get("app", "")

        logger.info(f"Unpublish - Stream key: {stream_key}, App: {app_name}")

        if not stream_key:
            logger.warning("No stream key provided for unpublish")
            return {"status": "ok"}  # Не блокируем unpublish

        # Ищем канал по stream key
        channel = db.query(Channel).filter(Channel.stream_key == stream_key).first()
        if not channel:
            logger.warning(f"Invalid stream key for unpublish: {stream_key}")
            return {"status": "ok"}

        # Получаем пользователя канала
        user = channel.user

        # Останавливаем стрим
        stream = db.query(Stream).filter(
            Stream.channel_id == channel.id,
            Stream.is_live == True
        ).first()

        if stream:
            stream.is_live = False
            db.commit()
            logger.info(f"Stream stopped for user {user.username}")

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"RTMP unpublish error: {e}")
        return {"status": "ok"}  # Не блокируем unpublish даже при ошибке

@router.get("/test")
async def test_endpoint():
    return {"status": "rtmp routes working"}

@router.get("/validate-key")
@router.post("/validate-key")
async def validate_stream_key(
    stream_key: str = "",
    db: Session = Depends(get_db)
):
    """
    Проверка валидности ключа стримов перед попыткой публикации в OBS
    """
    logger.info(f"🔍 Validating stream key: '{stream_key}'")
    
    if not stream_key:
        logger.warning("❌ No stream key provided")
        raise HTTPException(status_code=400, detail="Stream key required")
    
    # Ищем канал по stream key
    channel = db.query(Channel).filter(Channel.stream_key == stream_key).first()
    if not channel:
        logger.warning(f"❌ Invalid stream key: '{stream_key}'")
        raise HTTPException(status_code=403, detail="Invalid stream key")
    
    logger.info(f"✅ Stream key is valid for user {channel.user.username}")
    return {
        "status": "valid",
        "message": "Stream key is valid",
        "channel_id": channel.id,
        "username": channel.user.username
    }