import React, { useState, useEffect } from 'react';
import '../styles/ScheduleModal.css';

const ScheduleModal = ({ isOpen, schedule, onClose, onSave, onDelete, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
  });
  const [error, setError] = useState('');

  // Заполняем форму при редактировании
  useEffect(() => {
    if (schedule) {
      const scheduledDate = new Date(schedule.scheduled_at);
      const localDateTime = scheduledDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
      setFormData({
        title: schedule.title || '',
        description: schedule.description || '',
        scheduled_at: localDateTime,
      });
    } else {
      // Для нового расписания устанавливаем текущее время + 1 час
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      const defaultDateTime = tomorrow.toISOString().slice(0, 16);
      setFormData({
        title: '',
        description: '',
        scheduled_at: defaultDateTime,
      });
    }
    setError('');
  }, [schedule, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Валидация
    if (!formData.title.trim()) {
      setError('Название расписания обязательно');
      return;
    }

    if (!formData.scheduled_at) {
      setError('Дата и время обязательны');
      return;
    }

    // Проверка что время в будущем
    const selectedDate = new Date(formData.scheduled_at);
    if (selectedDate <= new Date()) {
      setError('Выберите время в будущем');
      return;
    }

    onSave(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены? Это действие нельзя отменить.')) {
      onDelete(schedule.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-modal-overlay" onClick={onClose}>
      <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <h2>{schedule ? 'Редактировать расписание' : 'Создать расписание'}</h2>
          <button className="schedule-modal-close" onClick={onClose} title="Закрыть">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="schedule-form">
          {error && <div className="schedule-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Название трансляции</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Введите название трансляции"
              maxLength={100}
              disabled={isLoading}
            />
            <div className="char-count">
              {formData.title.length}/100
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание (опционально)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Введите описание трансляции"
              maxLength={500}
              rows={4}
              disabled={isLoading}
            />
            <div className="char-count">
              {formData.description.length}/500
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="scheduled_at">Дата и время начала</label>
            <input
              type="datetime-local"
              id="scheduled_at"
              name="scheduled_at"
              value={formData.scheduled_at}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <div className="hint">
              Будущее время в вашем часовом поясе
            </div>
          </div>

          <div className="schedule-modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Отменить
            </button>

            {schedule && (
              <button
                type="button"
                className="btn-delete"
                onClick={handleDelete}
                disabled={isLoading}
                title="Удалить это расписание"
              >
                Удалить
              </button>
            )}

            <button
              type="submit"
              className="btn-save"
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : schedule ? 'Обновить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
