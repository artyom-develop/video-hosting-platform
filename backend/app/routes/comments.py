from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Comment, Stream, User
from app.schemas.schemas import CommentResponse, CommentCreate, CommentUpdate
from datetime import datetime

router = APIRouter(prefix="/api", tags=["comments"])

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token in request"""
    from app.core.security import verify_token
    
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
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

# POST /api/videos/{stream_id}/comments - Create comment
@router.post("/videos/{stream_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    stream_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new comment on a video"""
    # Check if stream exists
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Видео не найдено"
        )
    
    # Create comment
    comment = Comment(
        stream_id=stream_id,
        user_id=current_user.id,
        text=comment_data.text
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Load user data
    comment.user = current_user
    
    return comment

# GET /api/videos/{stream_id}/comments - Get all comments for a video
@router.get("/videos/{stream_id}/comments", response_model=list[CommentResponse])
async def get_comments(
    stream_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all comments for a video"""
    # Check if stream exists
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Видео не найдено"
        )
    
    comments = db.query(Comment).filter(
        Comment.stream_id == stream_id
    ).order_by(
        Comment.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    # Load user data for each comment
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        comment.user = user
    
    return comments

# GET /api/comments/{comment_id} - Get specific comment
@router.get("/comments/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: int,
    db: Session = Depends(get_db)
):
    """Get specific comment"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Комментарий не найден"
        )
    
    # Load user data
    user = db.query(User).filter(User.id == comment.user_id).first()
    comment.user = user
    
    return comment

# PUT /api/comments/{comment_id} - Update comment
@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a comment (only owner can update)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Комментарий не найден"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете редактировать чужой комментарий"
        )
    
    comment.text = comment_data.text
    comment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(comment)
    
    # Load user data
    user = db.query(User).filter(User.id == comment.user_id).first()
    comment.user = user
    
    return comment

# DELETE /api/comments/{comment_id} - Delete comment
@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment (only owner can delete)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Комментарий не найден"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете удалять чужой комментарий"
        )
    
    db.delete(comment)
    db.commit()
    
    return None
