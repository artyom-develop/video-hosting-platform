import React from 'react';
import { EditIcon, DeleteIcon } from './ScheduleIcons';
import '../styles/ScheduleList.css';

const ScheduleList = ({ schedules, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return <div className="schedule-loading">Загрузка расписания...</div>;
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="schedule-empty">
        <p>Нет запланированных трансляций</p>
      </div>
    );
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (
      date.toDateString() === today.toDateString()
    ) {
      return 'Сегодня';
    } else if (
      date.toDateString() === tomorrow.toDateString()
    ) {
      return 'Завтра';
    }

    return date.toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getScheduleStatus = (dateString) => {
    const now = new Date();
    const scheduleDate = new Date(dateString);
    const diffMs = scheduleDate - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { status: 'passed', text: 'Закончилась' };
    } else if (diffMs < 1000 * 60 * 60) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return { status: 'soon', text: `Через ${minutes} мин` };
    } else if (diffMs < 1000 * 60 * 60 * 24) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      return { status: 'today', text: `Через ${hours}ч` };
    } else if (diffDays === 1) {
      return { status: 'tomorrow', text: 'Завтра' };
    } else {
      return { status: 'future', text: `Через ${diffDays} дней` };
    }
  };

  return (
    <div className="schedule-list">
      <div className="schedule-list-header">
        <h3>Запланированные трансляции</h3>
      </div>
      
      <div className="schedule-items">
        {schedules.map((item) => {
          const { status, text } = getScheduleStatus(item.scheduled_at);
          const date = formatDate(item.scheduled_at);
          const time = formatTime(item.scheduled_at);
          
          return (
            <div key={item.id} className={`schedule-item schedule-${status}`}>
              <div className="schedule-item-header">
                <div className="schedule-datetime-block">
                  <div className="schedule-date">{date}</div>
                  <div className="schedule-time-display">{time}</div>
                </div>

                <div className="schedule-details">
                  <div className="schedule-title-section">
                    <h4 className="schedule-title">{item.title}</h4>
                    <span className={`schedule-status schedule-status-${status}`}>
                      {text}
                    </span>
                  </div>

                  {item.description && (
                    <p className="schedule-description">{item.description}</p>
                  )}
                </div>
              </div>

              <div className="schedule-actions">
                <button
                  className="btn-edit-schedule"
                  onClick={() => onEdit(item)}
                  title="Редактировать"
                  disabled={isLoading}
                >
                  <EditIcon size={16} />
                  Редактировать
                </button>
                <button
                  className="btn-delete-schedule"
                  onClick={() => onDelete(item.id)}
                  title="Удалить"
                  disabled={isLoading}
                >
                  <DeleteIcon size={16} />
                  Удалить
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleList;
