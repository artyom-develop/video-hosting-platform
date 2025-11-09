import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Profile.css';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [streamKey, setStreamKey] = useState('');
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('streams');

  // Данные для разделов
  const [streams, setStreams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchStreamKey();
    } else if (activeTab === 'streams') {
      fetchStreams();
    } else if (activeTab === 'videos') {
      fetchVideos();
    } else if (activeTab === 'schedule') {
      fetchSchedule();
    }
  }, [activeTab]);

  const fetchStreams = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/streams/user/${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setStreams(data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке стримов:', err);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/videos/user/${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке видео:', err);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/schedule/user/${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке расписания:', err);
    }
  };

  const fetchStreamKey = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/channels/1/stream-key?user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setStreamKey(data.stream_key);
      }
    } catch (err) {
      setError('Ошибка при получении ключа потока');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: fullName,
            bio: bio,
          }),
        }
      );

      if (response.ok) {
        setSuccess('Профиль успешно обновлён!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Ошибка при обновлении профиля');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/channels/1/regenerate-stream-key?user_id=${user.id}`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStreamKey(data.stream_key);
        setSuccess('Ключ потока успешно переген!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Ошибка при переген. ключа');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Скопировано в буфер обмена!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div>
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-info">
            <h1>{user?.full_name || user?.username}</h1>
            <p className="profile-username">@{user?.username}</p>
            <p className="profile-bio">{user?.bio || 'Нет описания'}</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={activeTab === 'streams' ? 'active' : ''}
            onClick={() => setActiveTab('streams')}
          >
            Стримы
          </button>
          <button
            className={activeTab === 'schedule' ? 'active' : ''}
            onClick={() => setActiveTab('schedule')}
          >
            Расписание
          </button>
          <button
            className={activeTab === 'videos' ? 'active' : ''}
            onClick={() => setActiveTab('videos')}
          >
            Видео
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Настройки
          </button>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

      {activeTab === 'streams' && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Мои стримы</h2>
            <button className="btn-stream">Начать трансляцию</button>
          </div>
          
          {streams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>У вас пока нет стримов</h3>
              <p>Начните свою первую трансляцию!</p>
              <button className="btn-white">Создать стрим</button>
            </div>
          ) : (
            <div className="streams-grid">
              {streams.map(stream => (
                <div key={stream.id} className="stream-card">
                  <div className="stream-thumbnail">
                    <img src={stream.thumbnail || '/default-stream.jpg'} alt={stream.title} />
                    <div className="stream-status">{stream.is_live ? 'LIVE' : 'OFFLINE'}</div>
                  </div>
                  <div className="stream-info">
                    <h3>{stream.title}</h3>
                    <p>{stream.description}</p>
                    <div className="stream-stats">
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {stream.viewers || 0}
                      </span>
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {new Date(stream.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Расписание стримов</h2>
            <button className="btn-white">Добавить событие</button>
          </div>
          
          {schedule.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <path d="m9 16 2 2 4-4"/>
                </svg>
              </div>
              <h3>Расписание пустое</h3>
              <p>Запланируйте свои стримы заранее</p>
              <button className="btn-white">Создать расписание</button>
            </div>
          ) : (
            <div className="schedule-list">
              {schedule.map(event => (
                <div key={event.id} className="schedule-item">
                  <div className="schedule-time">
                    <div className="date">{new Date(event.date).toLocaleDateString()}</div>
                    <div className="time">{event.time}</div>
                  </div>
                  <div className="schedule-content">
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <div className="schedule-actions">
                      <button className="btn-secondary">Редактировать</button>
                      <button className="btn-danger">Удалить</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Мои видео</h2>
            <button className="btn-white">Загрузить видео</button>
          </div>
          
          {videos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <h3>У вас пока нет видео</h3>
              <p>Загрузите свое первое видео!</p>
              <button className="btn-white">Загрузить видео</button>
            </div>
          ) : (
            <div className="videos-grid">
              {videos.map(video => (
                <div key={video.id} className="video-card">
                  <div className="video-thumbnail">
                    <img src={video.thumbnail || '/default-video.jpg'} alt={video.title} />
                    <div className="video-duration">{video.duration}</div>
                  </div>
                  <div className="video-info">
                    <h3>{video.title}</h3>
                    <p>{video.description}</p>
                    <div className="video-stats">
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {video.views || 0}
                      </span>
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        {video.likes || 0}
                      </span>
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="video-actions">
                      <button className="btn-secondary">Редактировать</button>
                      <button className="btn-danger">Удалить</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="profile-section">
          <div className="settings-grid">
            {/* Редактирование профиля */}
            <div className="settings-card">
              <h3>Профиль</h3>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label>Имя пользователя</label>
                  <input type="text" value={user?.username} disabled />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user?.email} disabled />
                </div>

                <div className="form-group">
                  <label>Полное имя</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Описание профиля</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows="4"
                    placeholder="Расскажите о себе..."
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-white">
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </form>
            </div>

            {/* Ключ трансляции */}
            <div className="settings-card">
              <h3>Ключ трансляции</h3>
              <div className="stream-key-info">
                <p>Используйте этот ключ для трансляции в OBS Studio</p>

                <div className="config-box">
                  <h4>RTMP URL:</h4>
                  <div className="config-row">
                    <code className="config-code">rtmp://localhost:1935/live</code>
                    <button
                      className="btn-copy"
                      onClick={() => copyToClipboard('rtmp://localhost:1935/live')}
                    >
                      Копировать
                    </button>
                  </div>
                </div>

                <div className="config-box">
                  <h4>Stream Key:</h4>
                  <div className="config-row">
                    <code className="config-code">
                      {showStreamKey ? streamKey : '*'.repeat(streamKey.length)}
                    </code>
                    <button
                      className="btn-copy"
                      onClick={() => copyToClipboard(streamKey)}
                    >
                      Копировать
                    </button>
                    <button
                      className="btn-toggle"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                    >
                      {showStreamKey ? 'Скрыть' : 'Показать'}
                    </button>
                  </div>
                </div>

                <div className="instructions">
                  <h4>Инструкции:</h4>
                  <ol>
                    <li>Откройте OBS Studio</li>
                    <li>Settings → Stream</li>
                    <li>Service: Custom</li>
                    <li>Вставьте RTMP URL</li>
                    <li>Вставьте Stream Key</li>
                    <li>Нажмите "Start Streaming"</li>
                  </ol>
                </div>

                <button
                  onClick={handleRegenerateKey}
                  disabled={loading}
                  className="btn-danger"
                >
                  {loading ? 'Генерация...' : 'Перегенерировать ключ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-wrapper">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>О нас</h4>
              <p>XaTube - платформа прямых трансляций для создателей</p>
            </div>
            <div className="footer-section">
              <h4>Платформа</h4>
              <ul>
                <li><a href="#browse">Обзор</a></li>
                <li><a href="#trending">Популярное</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Сообщество</h4>
              <ul>
                <li><a href="#discord">Discord</a></li>
                <li><a href="#twitter">Twitter</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Поддержка</h4>
              <ul>
                <li><a href="#help">Справка</a></li>
                <li><a href="#contact">Контакты</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 XaTube. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
