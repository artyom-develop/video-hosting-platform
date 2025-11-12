import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LiveStreamPlayer from '../components/LiveStreamPlayer';
import '../styles/Profile.css';

const PublicProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [streams, setStreams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [activeTab, setActiveTab] = useState('streams');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (username) {
      // Проверяем, не является ли username зарезервированным словом
      const reservedWords = ['login', 'register', 'profile', 'statistics', 'player', 'watch', 'test-stream', 'api', 'docs'];
      if (reservedWords.includes(username.toLowerCase())) {
        setError('Пользователь не найден');
        setLoading(false);
        return;
      }
      
      fetchUserProfile();
    }
  }, [username]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'streams') {
        fetchStreams();
      } else if (activeTab === 'videos') {
        fetchVideos();
      } else if (activeTab === 'schedule') {
        fetchSchedule();
      }
    }
  }, [user, activeTab]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/profile/${username}`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 404) {
        // Пользователь не найден, перенаправляем на главную
        navigate('/', { replace: true });
        return;
      } else {
        setError('Ошибка при загрузке профиля');
      }
    } catch (err) {
      console.error('Ошибка при загрузке профиля:', err);
      setError('Ошибка при загрузке профиля');
    } finally {
      setLoading(false);
    }
  };

  const fetchStreams = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/streams/user/${user.id}`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Фильтруем только активные стримы для публичного профиля
        const liveStreams = data.filter(stream => stream.is_live);
        setStreams(liveStreams);
      }
    } catch (err) {
      console.error('Ошибка при загрузке стримов:', err);
    }
  };

  const fetchVideos = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/videos/user/${user.id}`,
        {
          credentials: 'include'
        }
      );
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      } else if (response.status === 404) {
        // Endpoint not implemented yet
        console.warn('Videos endpoint not available');
      }
    } catch (err) {
      console.error('Ошибка при загрузке видео:', err);
    }
  };

  const fetchSchedule = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/schedule/user/${user.id}`,
        {
          credentials: 'include'
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else if (response.status === 404) {
        // Endpoint not implemented yet
        console.warn('Schedule endpoint not available');
      }
    } catch (err) {
      console.error('Ошибка при загрузке расписания:', err);
    }
  };

  const handleSubscribe = () => {
    // Заглушка для подписки
    setIsSubscribed(!isSubscribed);
    // TODO: Реализовать API для подписки/отписки
    console.log(`${isSubscribed ? 'Отписка от' : 'Подписка на'} пользователя ${username}`);
  };

  const handleWatchStream = (stream) => {
    const streamKeyToUse = stream.channel?.stream_key;
    if (streamKeyToUse) {
      navigate(`/watch/${streamKeyToUse}`);
    } else {
      setError('Не удалось открыть стрим: отсутствует ключ стрима');
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Загрузка профиля...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-container">
        <div className="error-message">{error || 'Пользователь не найден'}</div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === user.id;

  return (
    <div>
      <div className="profile-container">
        <div className="public-profile-header">
          <div className="public-profile-left">
            <div className="profile-avatar-large">
              {user.avatar_url ? (
                <img
                  src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${user.avatar_url}`}
                  alt="Avatar"
                  className="avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                user.username ? user.username.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="profile-info">
              <h1>{user.full_name || user.username}</h1>
              <p className="profile-username">@{user.username}</p>
              <p className="profile-bio">{user.bio || 'Нет описания'}</p>
            </div>
          </div>
          {!isOwnProfile && (
            <button
              className={`btn-subscribe ${isSubscribed ? 'subscribed' : ''}`}
              onClick={handleSubscribe}
            >
              {isSubscribed ? 'Отписаться' : 'Подписаться'}
            </button>
          )}
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
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'streams' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Стримы</h2>
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
                <h3>Нет активных стримов</h3>
                <p>Этот пользователь сейчас не ведет трансляцию</p>
              </div>
            ) : (
              <div className="streams-container">
                {streams.map(stream => (
                  <div key={stream.id} className="stream-large-card" onClick={() => handleWatchStream(stream)} style={{cursor: 'pointer'}}>
                    <div className="stream-large-thumbnail">
                      {stream.is_live ? (
                        <LiveStreamPlayer
                          streamKey={stream.channel?.stream_key}
                          onError={(error) => console.error('Stream error:', error)}
                        />
                      ) : (
                        <img src={stream.thumbnail_url ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${stream.thumbnail_url}` : '/default-stream.jpg'} alt={stream.title} />
                      )}
                      <div className="stream-large-status">{stream.is_live ? 'LIVE' : 'OFFLINE'}</div>
                    </div>
                    <div className="stream-large-info">
                      <h3>{stream.title}</h3>
                      <p>{stream.description}</p>
                      <div className="stream-large-stats">
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          {stream.view_count || 0} просмотров
                        </span>
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                          </svg>
                          {Math.floor(stream.duration / 60)}:{(stream.duration % 60).toString().padStart(2, '0')}
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
                <p>Этот пользователь еще не запланировал стримы</p>
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
              <h2>Видео</h2>
            </div>

            {videos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <h3>Нет видео</h3>
                <p>Этот пользователь еще не загрузил видео</p>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default PublicProfilePage;