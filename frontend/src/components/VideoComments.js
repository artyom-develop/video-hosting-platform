import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import '../styles/VideoComments.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const VideoComments = ({ videoId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('Ошибка при загрузке комментариев');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      alert('Комментарий не может быть пустым');
      return;
    }

    if (!user) {
      alert('Вы должны быть авторизованы для написания комментариев');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: commentText
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке комментария');
      }

      setCommentText('');
      await fetchComments();
    } catch (err) {
      console.error('Failed to submit comment:', err);
      setError('Ошибка при отправке комментария');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Удалить комментарий?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении комментария');
      }

      await fetchComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Ошибка при удалении комментария');
    }
  };

  return (
    <div className="video-comments">
      <div className="comments-header">
        <h3>Комментарии</h3>
        <span className="comments-count">({comments.length})</span>
      </div>

      {error && (
        <div className="comments-error">
          {error}
        </div>
      )}

      {user && (
        <form className="comment-form" onSubmit={handleSubmitComment}>
          <Avatar 
            src={user.avatar_url}
            alt={user.username}
            username={user.username}
            size="small"
          />
          <div className="comment-input-wrapper">
            <textarea
              className="comment-textarea"
              placeholder="Оставить комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows="3"
            />
            <button
              type="submit"
              className="comment-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Отправка...' : 'Комментировать'}
            </button>
          </div>
        </form>
      )}

      {!user && (
        <div className="auth-prompt">
          <p>Авторизуйтесь для написания комментариев</p>
        </div>
      )}

      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">Загрузка комментариев...</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">Комментариев пока нет. Будьте первым!</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment">
              <Avatar 
                src={comment.user?.avatar_url}
                alt={comment.user?.username}
                username={comment.user?.username}
                size="small"
              />
              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-author">{comment.user?.username}</span>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
                {user && user.id === comment.user_id && (
                  <button
                    className="delete-comment-btn"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoComments;
