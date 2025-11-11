import React, { useState, useRef, useEffect } from 'react';
import '../styles/StreamModal.css';

const StreamModal = ({ isOpen, onClose, onSave, stream = null, isLoading = false }) => {
  const [title, setTitle] = useState(stream?.title || '');
  const [description, setDescription] = useState(stream?.description || '');
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(stream?.thumbnail_url || null);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  // Обновляем состояния при изменении stream (для редактирования)
  useEffect(() => {
    if (stream) {
      setTitle(stream.title || '');
      setDescription(stream.description || '');
      setThumbnailPreview(stream.thumbnail_url || null);
      setThumbnail(null); // Сбрасываем новый файл при открытии существующего стрима
      setErrors({});
    } else {
      // Для создания нового стрима
      setTitle('');
      setDescription('');
      setThumbnailPreview(null);
      setThumbnail(null);
      setErrors({});
    }
  }, [stream]);

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Название стрима обязательно';
    } else if (title.length > 200) {
      newErrors.title = 'Название не может быть длиннее 200 символов';
    }

    if (description && description.length > 1000) {
      newErrors.description = 'Описание не может быть длиннее 1000 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка размера файла (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, thumbnail: 'Размер файла не должен превышать 5MB' });
        return;
      }

      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, thumbnail: 'Файл должен быть изображением' });
        return;
      }

      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setErrors({ ...errors, thumbnail: null });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }

    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Error saving stream:', error);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setThumbnail(null);
    setThumbnailPreview(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content stream-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{stream ? 'Редактировать стрим' : 'Создать новый стрим'}</h2>
          <button className="modal-close" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="stream-title">Название стрима *</label>
            <input
              id="stream-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название стрима"
              className={errors.title ? 'error' : ''}
              maxLength="200"
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="stream-description">Описание стрима</label>
            <textarea
              id="stream-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите ваш стрим (опционально)"
              rows="4"
              maxLength="1000"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label>Превью стрима</label>
            <div className="thumbnail-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                style={{ display: 'none' }}
              />
              <div className="thumbnail-preview">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Превью стрима" />
                ) : (
                  <div className="thumbnail-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                    <span>Выберите превью</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                {thumbnailPreview ? 'Изменить превью' : 'Выбрать превью'}
              </button>
            </div>
            {errors.thumbnail && <span className="error-message">{errors.thumbnail}</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose} disabled={isLoading}>
            Отмена
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Сохранение...' : (stream ? 'Сохранить' : 'Создать')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamModal;