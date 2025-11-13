import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LiveStreamPlayer from '../components/LiveStreamPlayer';
import StreamChat from '../components/StreamChat';
import RelatedStreams from '../components/RelatedStreams';
import ScheduleView from '../components/ScheduleView';
import Linkify from 'react-linkify';
import '../styles/StreamerProfilePage.css';

const StreamerProfilePage = () => {
  const { streamKey } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [stream, setStream] = useState(null);
  const [streamer, setStreamer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    console.log('🎬 StreamerProfilePage mounted with streamKey:', streamKey);
    fetchStreamDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamKey]);

  const fetchStreamDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${process.env.REACT_APP_API_URL}/streams/by-key/${streamKey}`;
      console.log('📡 Fetching stream details from:', url);

      const response = await fetch(url, {
        credentials: 'include'
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          setError(errorData.detail || 'Стрим не найден или в данный момент не активен');
          console.error('❌ Stream not found with key:', streamKey);
          return;
        }
        throw new Error('Ошибка загрузки стрима');
      }

      const data = await response.json();
      console.log('✅ Stream data received:', data);
      setStream(data);

      // Получаем информацию о стримере
      if (data.channel && data.channel.user_id) {
        await fetchStreamerInfo(data.channel.user_id, data.channel.id);
      }
    } catch (err) {
      console.error('Failed to fetch stream:', err);
      setError('Не удалось загрузить данные стрима');
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamerInfo = async (userId, channelId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/${userId}`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setStreamer(userData);
        // Загружаем расписание стримера
        if (channelId) {
          await fetchStreamerSchedule(channelId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch streamer info:', err);
    }
  };

  const fetchStreamerSchedule = async (channelId) => {
    try {
      setScheduleLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/schedules/channel/${channelId}`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else {
        setSchedule([]);
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSubscribe = () => {
    // Заглушка для подписки
    setIsSubscribed(!isSubscribed);
    if (streamer) {
      console.log(`${isSubscribed ? 'Отписка от' : 'Подписка на'} стримера ${streamer.username}`);
    }
    // TODO: Реализовать API для подписки/отписки
  };

  if (loading) {
    return (
      <div className="streamer-profile-container loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="streamer-profile-container error">
        <div className="error-content">
          <h2>{error}</h2>
          <button onClick={() => window.location.href = '/'} className="error-button">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (!stream) {
    return null;
  }

  const isOwnStream = currentUser && streamer && currentUser.id === streamer.id;

  return (
    <div className="streamer-profile-page">
      <div className="streamer-profile-wrapper">
        {/* Основной плеер с инфо */}
        <div className="streamer-main-section">
          {/* Плеер */}
          <div className="streamer-player-wrapper">
            <LiveStreamPlayer
              streamKey={streamKey}
              hlsUrl={`http://localhost:8080/live/${streamKey}/index.m3u8`}
            />
          </div>

          {/* Блок информации о стриме */}
          <div className="streamer-stream-header">
            <div className="streamer-stream-title-section">
              <h1 className="streamer-stream-title">{stream.title}</h1>
              <div className="streamer-stream-meta">
                <span className="streamer-viewers">
                  <span className="icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </span>
                  {stream.view_count || 0} просмотров
                </span>
                {stream.duration > 0 && (
                  <span className="streamer-duration">
                    <span className="icon">⏱️</span>
                    {formatDuration(stream.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Описание стрима */}
          {stream.description && (
            <div className="streamer-description-section">
              <h3>Описание</h3>
              <div className="streamer-description">
                <Linkify
                  componentDecorator={(decoratedHref, decoratedText, key) => (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={decoratedHref}
                      key={key}
                      style={{ color: '#ff4757', textDecoration: 'underline' }}
                    >
                      {decoratedText}
                    </a>
                  )}
                >
                  {stream.description}
                </Linkify>
              </div>
            </div>
          )}

          {/* Информация о стримере */}
          {streamer && (
            <div className="streamer-info-section">
              <h3>О стримере</h3>
              <div className="streamer-profile-card">
                <div className="streamer-avatar-section">
                  <img
                    src={streamer.avatar_url ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${streamer.avatar_url}` : '/default-avatar.svg'}
                    alt={streamer.username}
                    className="streamer-avatar"
                  />
                </div>
                <div className="streamer-details">
                  <div className="streamer-header">
                    <h4 className="streamer-name">{streamer.full_name || streamer.username}</h4>
                    <p className="streamer-username">@{streamer.username}</p>
                  </div>
                  {streamer.bio && (
                    <p className="streamer-bio">{streamer.bio}</p>
                  )}
                  <div className="streamer-stats">
                    <span>Подписчиков: 0</span>
                    <span>Стримов: 0</span>
                  </div>
                </div>
                {!isOwnStream && (
                  <button
                    className={`btn-subscribe ${isSubscribed ? 'subscribed' : ''}`}
                    onClick={handleSubscribe}
                  >
                    {isSubscribed ? 'Отписаться' : 'Подписаться'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Правая сторона: чат */}
        <div className="streamer-sidebar">
          <StreamChat streamKey={streamKey} />
        </div>
      </div>

      {/* Расписание стримов */}
      {schedule.length > 0 && (
        <div className="streamer-schedule-wrapper">
          <ScheduleView schedules={schedule} isLoading={scheduleLoading} compact={true} />
        </div>
      )}

      {/* Снизу: похожие стримы */}
      <div className="streamer-related-wrapper">
        <RelatedStreams currentStreamKey={streamKey} />
      </div>
    </div>
  );
};

const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

export default StreamerProfilePage;