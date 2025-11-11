from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Channel, Stream, User
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/streams", tags=["stream-chat"])

# Store active connections per stream
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, stream_key: str, websocket: WebSocket):
        await websocket.accept()
        if stream_key not in self.active_connections:
            self.active_connections[stream_key] = []
        self.active_connections[stream_key].append(websocket)
        logger.info(f"Client connected to stream {stream_key}. Total connections: {len(self.active_connections[stream_key])}")

    def disconnect(self, stream_key: str, websocket: WebSocket):
        if stream_key in self.active_connections:
            self.active_connections[stream_key].remove(websocket)
            logger.info(f"Client disconnected from stream {stream_key}. Total connections: {len(self.active_connections[stream_key])}")

    async def broadcast(self, stream_key: str, message: dict):
        """Broadcast message to all connected clients for a stream"""
        if stream_key in self.active_connections:
            disconnected = []
            for connection in self.active_connections[stream_key]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message: {e}")
                    disconnected.append(connection)
            
            # Remove disconnected clients
            for conn in disconnected:
                self.disconnect(stream_key, conn)

manager = ConnectionManager()

@router.websocket("/ws/{stream_key}/chat")
async def websocket_chat_endpoint(websocket: WebSocket, stream_key: str, db: Session = Depends(get_db)):
    """WebSocket endpoint for stream chat"""
    
    # Verify stream exists
    channel = db.query(Channel).filter(Channel.stream_key == stream_key).first()
    if not channel:
        await websocket.close(code=status.WS_1000_NORMAL_CLOSURE, reason="Stream not found")
        return
    
    await manager.connect(stream_key, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # Parse incoming message
            try:
                message_data = json.loads(data)
            except json.JSONDecodeError:
                continue
            
            # Extract message info
            text = message_data.get("text", "").strip()
            
            # Skip empty messages
            if not text:
                continue
            
            # Validate message length
            if len(text) > 500:
                text = text[:500]
            
            # Get user info from token (from query param or header)
            # For now, use anonymous
            username = message_data.get("username", "Аноним")
            avatar = message_data.get("avatar", None)
            
            # Create broadcast message
            broadcast_message = {
                "type": "message",
                "text": text,
                "username": username,
                "avatar": avatar,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Broadcasting message from {username} in stream {stream_key}: {text[:50]}...")
            
            # Broadcast to all connected clients
            await manager.broadcast(stream_key, broadcast_message)
    
    except WebSocketDisconnect:
        manager.disconnect(stream_key, websocket)
        logger.info(f"WebSocket disconnected for stream {stream_key}")
    except Exception as e:
        logger.error(f"WebSocket error for stream {stream_key}: {e}")
        manager.disconnect(stream_key, websocket)
