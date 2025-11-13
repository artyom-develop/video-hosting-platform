import React, { useState, useEffect } from 'react';
import '../styles/VideoEditModal.css';

const VideoEditModal = ({ isOpen, video, onClose, onSave, isLoading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
      setError('');
    }
  }, [video, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Название видео обязательно');
      return;
    }

    if (title.length > 200) {
      setError('Название не должно превышать 200 символов');
      return;
    }

    if (description.length > 5000) {
      setError('Описание не должно превышать 5000 символов');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim()
    });
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  if (!isOpen || !video) return null;

  return (
    <div className="video-edit-overlay">
      <div className="video-edit-modal">
        <div className="video-edit-header">
          <h2>✏️ Редактировать видео</h2>
          <button 
            className="video-edit-close" 
            onClick={handleClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="video-edit-form">
          {/* Title */}
          <div className="form-group">
            <label>Название видео *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder="Введите название видео"
              maxLength="200"
              disabled={isLoading}
              required
            />
            <div className="char-count">{title.length}/200</div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Описание (опционально)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
              placeholder="Введите описание видео..."
              maxLength="5000"
              disabled={isLoading}
              rows="4"
            />
            <div className="char-count">{description.length}/5000</div>
          </div>

          {/* Error Message */}
          {error && typeof error === 'string' && (
            <div className="video-edit-error">
              <span>❌ {error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="video-edit-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Сохранение...' : '💾 Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoEditModal;
