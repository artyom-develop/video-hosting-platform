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
    Это блокирующий хук - если вернуть ошибку, nginx разорвет соединение
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

        # 1. ВАЛИДАЦИЯ КЛЮЧА - самая важная проверка!
        if not stream_key or stream_key.strip() == "":
            logger.warning("❌ No stream key provided or empty key")
            raise HTTPException(status_code=403, detail="Stream key required")

        # Ищем канал по stream key в БД
        channel = db.query(Channel).filter(Channel.stream_key == stream_key).first()
        if not channel:
            logger.warning(f"❌ INVALID stream key: '{stream_key}' - not found in database")
            raise HTTPException(status_code=403, detail="Invalid stream key")

        # Получаем пользователя канала
        user = channel.user
        logger.info(f"✅ Stream key validated for user: {user.username} (Channel ID: {channel.id})")

        # 2. ОБНОВЛЯЕМ СТАТУС КАНАЛА
        # ВАЖНО: Также обновляем Channel.is_live, чтобы канал появился в списке live стримов
        if not channel.is_live:
            channel.is_live = True
            logger.info(f"📡 Updated Channel {channel.id} to is_live=True")
        
        # 3. ПРИМЕНЯЕМ RTMP ПОТОК К СУЩЕСТВУЮЩЕМУ СТРИМУ НА ПРОФИЛЕ
        from datetime import datetime
        
        # ШАГ 1: Ищем черновик (is_live=False) на этом канале - это стрим, подготовленный на профиле
        stream = db.query(Stream).filter(
            Stream.channel_id == channel.id,
            Stream.is_live == False
        ).order_by(Stream.created_at.desc()).first()

        if stream:
            # Нашли черновик - применяем к нему HLS поток
            logger.info(f"📹 Found draft stream {stream.id}, applying HLS stream to it")
            stream.is_live = True
            stream.started_at = datetime.utcnow()
            logger.info(f"📹 Stream {stream.id} activated: is_live=True, started_at={stream.started_at}")
        else:
            # ШАГ 2: Если черновика нет, создаем новый стрим (для прямых трансляций без подготовки)
            logger.info(f"📹 No draft stream found, creating new one")
            stream = Stream(
                channel_id=channel.id,
                title=f"Live Stream - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
                description="Live streaming session",
                is_live=True,
                started_at=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
            db.add(stream)
            logger.info(f"📹 Created new Stream for Channel {channel.id}")

        # Коммитим все изменения
        db.commit()
        
        logger.info(f"✅ RTMP publish successful - User: {user.username}, Channel ID: {channel.id}, Stream ID: {stream.id}")
        return {"status": "ok", "channel_id": channel.id, "stream_id": stream.id}

    except HTTPException:
        logger.error(f"RTMP publish validation failed - rejecting connection")
        raise
    except Exception as e:
        logger.error(f"❌ RTMP publish error: {type(e).__name__}: {str(e)}", exc_info=True)
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
        logger.info(f"🛑 RTMP unpublish request: {dict(form_data)}")

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

        # 1. ОБНОВЛЯЕМ СТАТУС КАНАЛА
        if channel.is_live:
            channel.is_live = False
            logger.info(f"📡 Updated Channel {channel.id} to is_live=False for user {user.username}")

        # 2. ОСТАНАВЛИВАЕМ ТЕКУЩИЙ СТРИМ
        stream = db.query(Stream).filter(
            Stream.channel_id == channel.id,
            Stream.is_live == True
        ).first()

        if stream:
            from datetime import datetime
            stream.is_live = False
            stream.ended_at = datetime.utcnow()
            logger.info(f"📹 Stream {stream.id} stopped for user {user.username}")

        db.commit()
        logger.info(f"✅ RTMP unpublish successful - User: {user.username}, Channel ID: {channel.id}")
        return {"status": "ok"}

    except Exception as e:
        logger.error(f"RTMP unpublish error: {type(e).__name__}: {str(e)}", exc_info=True)
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