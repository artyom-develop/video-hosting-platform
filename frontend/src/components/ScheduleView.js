import React from 'react';
import '../styles/ScheduleView.css';

const ScheduleView = ({ schedules, isLoading, compact = false }) => {
  if (isLoading) {
    return <div className="schedule-view-loading">Загрузка расписания...</div>;
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="schedule-view-empty">
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

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === tomorrow.toDateString()) {
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

  if (compact) {
    // Компактный вид для встраивания на другие страницы
    return (
      <div className="schedule-view-compact">
        <div className="schedule-view-header">
          <h3>📅 Расписание</h3>
        </div>
        
        <div className="schedule-view-items">
          {schedules.slice(0, 3).map((item) => {
            const { status, text } = getScheduleStatus(item.scheduled_at);
            const date = formatDate(item.scheduled_at);
            const time = formatTime(item.scheduled_at);
            
            return (
              <div key={item.id} className={`schedule-view-item schedule-view-${status}`}>
                <div className="schedule-view-time">
                  <span className="schedule-view-date">{date}</span>
                  <span className="schedule-view-time-value">{time}</span>
                </div>
                <div className="schedule-view-content">
                  <p className="schedule-view-title">{item.title}</p>
                </div>
                <span className={`schedule-view-status schedule-view-status-${status}`}>
                  {text}
                </span>
              </div>
            );
          })}
        </div>

        {schedules.length > 3 && (
          <div className="schedule-view-more">
            Еще {schedules.length - 3} событий
          </div>
        )}
      </div>
    );
  }

  // Полный вид
  return (
    <div className="schedule-view">
      <div className="schedule-view-header">
        <h2>Расписание стримов</h2>
      </div>
      
      <div className="schedule-view-items">
        {schedules.map((item) => {
          const { status, text } = getScheduleStatus(item.scheduled_at);
          const date = formatDate(item.scheduled_at);
          const time = formatTime(item.scheduled_at);
          
          return (
            <div key={item.id} className={`schedule-view-item schedule-view-${status}`}>
              <div className="schedule-view-datetime">
                <div className="schedule-view-date">{date}</div>
                <div className="schedule-view-time-display">{time}</div>
              </div>

              <div className="schedule-view-content">
                <h4 className="schedule-view-title">{item.title}</h4>
                {item.description && (
                  <p className="schedule-view-description">{item.description}</p>
                )}
              </div>

              <span className={`schedule-view-status schedule-view-status-${status}`}>
                {text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleView;
