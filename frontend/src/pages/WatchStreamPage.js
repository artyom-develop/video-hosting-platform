import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LiveStreamPlayer from '../components/LiveStreamPlayer';
import StreamChat from '../components/StreamChat';
import RelatedStreams from '../components/RelatedStreams';
import Linkify from 'react-linkify';
import '../styles/WatchStreamPage.css';

const WatchStreamPage = () => {
  const { streamKey } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    console.log('🎬 WatchStreamPage mounted with streamKey:', streamKey);
    fetchStreamDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamKey]);

  useEffect(() => {
    if (stream && stream.channel && currentUser) {
      checkSubscriptionStatus();
    }
  }, [stream, currentUser]);

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
    } catch (err) {
      console.error('Failed to fetch stream:', err);
      setError('Не удалось загрузить данные стрима');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (isSubscribed) {
      handleUnsubscribe();
    } else {
      handleSubscribe_API();
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/subscriptions/${stream.channel.id}/is-subscribed`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(data.is_subscribed);
      }
    } catch (err) {
      console.error('Ошибка при проверке подписки:', err);
    }
  };

  const handleSubscribe_API = async () => {
    if (!stream || !stream.channel) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/subscriptions/${stream.channel.id}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (response.ok) {
        setIsSubscribed(true);
        console.log('✅ Subscribed successfully');
      } else if (response.status === 400) {
        // Already subscribed
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Ошибка при подписке:', err);
    }
  };

  const handleUnsubscribe = async () => {
    if (!stream || !stream.channel) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/subscriptions/${stream.channel.id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        setIsSubscribed(false);
        console.log('✅ Unsubscribed successfully');
      }
    } catch (err) {
      console.error('Ошибка при отписке:', err);
    }
  };

  if (loading) {
    return (
      <div className="watch-stream-container loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="watch-stream-container error">
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

  return (
    <div className="watch-stream-page">
      <div className="watch-stream-wrapper">
        {/* Основной плеер с инфо */}
        <div className="watch-main-section">
          {/* Плеер */}
          <div className="watch-player-wrapper">
            <LiveStreamPlayer 
              streamKey={streamKey}
              hlsUrl={`http://localhost:8080/live/${streamKey}/index.m3u8`}
            />
          </div>

          {/* Блок информации о стриме */}
          <div className="watch-stream-header">
            <div className="watch-stream-title-section">
              <h1 className="watch-stream-title">{stream.title}</h1>
              <div className="watch-stream-meta">
                <span className="watch-viewers">
                  <span className="icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </span>
                  {stream.view_count || 0} просмотров
                </span>
                {stream.duration > 0 && (
                  <span className="watch-duration">
                    <span className="icon">⏱️</span>
                    {formatDuration(stream.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Описание стрима */}
          {stream.description && (
            <div className="watch-description-section">
              <h3>Описание</h3>
              <div className="watch-description">
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

          {/* Информация о канале */}
          {stream.channel && (
            <div className="watch-channel-section">
              <h3>Создатель</h3>
              <div className="watch-channel-card">
                <img
                  src={stream.channel.avatar || '/default-avatar.jpg'}
                  alt={stream.channel.username}
                  className="watch-channel-avatar"
                />
                <div className="watch-channel-info">
                  <p className="watch-channel-name">{stream.channel.username}</p>
                  {stream.channel.bio && (
                    <p className="watch-channel-bio">{stream.channel.bio}</p>
                  )}
                </div>
                {currentUser && currentUser.id !== stream.channel.user_id && (
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
        <div className="watch-sidebar">
          <StreamChat streamKey={streamKey} />
        </div>
      </div>

      {/* Снизу: похожие стримы */}
      <div className="watch-related-wrapper">
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

export default WatchStreamPage;
