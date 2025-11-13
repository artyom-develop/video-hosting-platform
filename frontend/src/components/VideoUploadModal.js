import React, { useState, useRef } from 'react';
import '../styles/VideoUploadModal.css';

const VideoUploadModal = ({ isOpen, onClose, onUpload, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video: null,
    thumbnail: null,
  });
  const [error, setError] = useState('');
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleTitleChange = (e) => {
    const title = e.target.value.slice(0, 200);
    setFormData({ ...formData, title });
  };

  const handleDescriptionChange = (e) => {
    const description = e.target.value.slice(0, 5000);
    setFormData({ ...formData, description });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверяем размер (макс 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setError('Размер видео не должен превышать 500MB');
      return;
    }

    // Проверяем формат
    const validFormats = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validFormats.includes(file.type)) {
      setError('Поддерживаемые форматы: MP4, WebM, MOV, AVI');
      return;
    }

    setFormData({ ...formData, video: file });
    setVideoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверяем размер (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Размер изображения не должен превышать 10MB');
      return;
    }

    // Проверяем формат
    const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      setError('Поддерживаемые форматы: JPG, PNG, WebP');
      return;
    }

    setFormData({ ...formData, thumbnail: file });
    setThumbnailPreview(URL.createObjectURL(file));
    setError('');
  };

  const generateThumbnailFromVideo = async () => {
    if (!formData.video) return;

    try {
      const video = document.createElement('video');
      video.src = videoPreview;
      video.currentTime = 3; // Берем кадр с 3 секунды

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
          setFormData({ ...formData, thumbnail: file });
          setThumbnailPreview(canvas.toDataURL());
        }, 'image/jpeg', 0.95);
      };
    } catch (err) {
      console.error('Ошибка при создании превью:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (!formData.title.trim()) {
      setError('Название видео обязательно');
      return;
    }

    if (!formData.video) {
      setError('Выберите видео для загрузки');
      return;
    }

    // Если нет превью, генерируем из видео
    if (!formData.thumbnail && videoPreview) {
      await generateThumbnailFromVideo();
    }

    // Вызываем функцию загрузки
    await onUpload(formData, setUploadProgress);
    
    // Очищаем форму
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video: null,
      thumbnail: null,
    });
    setVideoPreview(null);
    setThumbnailPreview(null);
    setUploadProgress(0);
    setError('');
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="video-upload-overlay">
      <div className="video-upload-modal">
        <div className="video-upload-header">
          <h2>📹 Загрузить видео</h2>
          <button className="video-upload-close" onClick={handleClose} disabled={isLoading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="video-upload-form">
          {/* Title */}
          <div className="form-group">
            <label>Название видео *</label>
            <input
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="Введите название видео"
              maxLength="200"
              disabled={isLoading}
              required
            />
            <div className="char-count">{formData.title.length}/200</div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Описание (опционально)</label>
            <textarea
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Введите описание видео..."
              maxLength="5000"
              disabled={isLoading}
            />
            <div className="char-count">{formData.description.length}/5000</div>
          </div>

          {/* Video File */}
          <div className="form-group">
            <label>Видео файл * (макс. 500MB)</label>
            <div className="file-input-wrapper">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                disabled={isLoading}
                required
              />
              <div className="file-input-label">
                {videoPreview ? (
                  <>
                    <span>✓ Видео выбрано</span>
                    <small>{formData.video?.name}</small>
                  </>
                ) : (
                  <>
                    <span>📁 Выберите видео</span>
                    <small>MP4, WebM, MOV, AVI</small>
                  </>
                )}
              </div>
            </div>
            {videoPreview && (
              <video className="video-preview" src={videoPreview} controls />
            )}
          </div>

          {/* Thumbnail */}
          <div className="form-group">
            <label>Превью видео (опционально, макс. 10MB)</label>
            <p className="hint">Если не загрузить превью, будет автоматически создано с 3 секунды видео</p>
            <div className="file-input-wrapper">
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                disabled={isLoading}
              />
              <div className="file-input-label">
                {thumbnailPreview ? (
                  <>
                    <span>✓ Превью выбрано</span>
                    <small>{formData.thumbnail?.name}</small>
                  </>
                ) : (
                  <>
                    <span>🖼️ Выберите изображение</span>
                    <small>JPG, PNG, WebP</small>
                  </>
                )}
              </div>
            </div>
            {thumbnailPreview && (
              <img className="thumbnail-preview" src={thumbnailPreview} alt="Превью" />
            )}
          </div>

          {/* Error Message */}
          {error && typeof error === 'string' && (
            <div className="video-upload-error">
              <span>❌ {error}</span>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                >
                  {uploadProgress}%
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="video-upload-actions">
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
              className="btn-upload"
              disabled={isLoading || !formData.video}
            >
              {isLoading ? '⏳ Загрузка...' : '⬆️ Загрузить видео'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoUploadModal;
