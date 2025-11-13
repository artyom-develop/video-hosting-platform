import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
import VideoComments from '../components/VideoComments';
import RelatedStreams from '../components/RelatedStreams';
import Avatar from '../components/Avatar';
import Linkify from 'react-linkify';
import '../styles/WatchVideoPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const WatchVideoPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    console.log('🎬 WatchVideoPage mounted with videoId:', videoId);
    fetchVideoDetails();
    incrementViewCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    if (video && video.channel && currentUser) {
      checkSubscriptionStatus();
    }
  }, [video, currentUser]);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}/streams/${videoId}`;
      console.log('📡 Fetching video details from:', url);

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Видео не найдено');
          console.error('❌ Video not found with id:', videoId);
          return;
        }
        throw new Error('Ошибка загрузки видео');
      }

      const data = await response.json();
      console.log('✅ Video data received:', data);
      setVideo(data);
    } catch (err) {
      console.error('Failed to fetch video:', err);
      setError('Не удалось загрузить видео');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await fetch(`${API_BASE_URL}/streams/${videoId}/view`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Failed to increment view count:', err);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/subscriptions/check/${video.user_id}`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(data.subscribed || false);
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  };

  const handleSubscribe = async () => {
    try {
      const method = isSubscribed ? 'DELETE' : 'POST';
      const response = await fetch(
        `${API_BASE_URL}/subscriptions/${video.user_id}`,
        {
          method,
          credentials: 'include'
        }
      );

      if (response.ok) {
        setIsSubscribed(!isSubscribed);
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
    }
  };

  if (loading && !video) {
    return (
      <div className="watch-stream-container loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="watch-stream-page watch-video-page">
      <div className="watch-stream-wrapper">
        {/* Основной плеер с инфо */}
        <div className="watch-main-section">
          {/* Плеер */}
          <div className="watch-player-wrapper">
            <VideoPlayer videoUrl={video.video_url} />
          </div>

          {/* Блок с ошибкой (если есть) */}
          {error && (
            <div className="watch-error-notice">
              <div className="error-icon">⚠️</div>
              <div className="error-text">
                <p className="error-message">{error}</p>
              </div>
            </div>
          )}

          {/* Блок информации о видео */}
          <div className="watch-stream-header">
            <div className="watch-stream-title-section">
              <h1 className="watch-stream-title">{video.title}</h1>
              <div className="watch-stream-meta">
                <span className="watch-viewers">
                  <span className="icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </span>
                  {video.view_count || 0} просмотров
                </span>
                <span className="watch-date">
                  <span className="icon">📅</span>
                  {new Date(video.created_at).toLocaleDateString('ru-RU')}
                </span>
                {video.duration > 0 && (
                  <span className="watch-duration">
                    <span className="icon">⏱️</span>
                    {formatDuration(video.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Описание видео */}
          {video.description && (
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
                  {video.description}
                </Linkify>
              </div>
            </div>
          )}

          {/* Информация о канале */}
          {video.channel && (
            <div className="watch-channel-section">
              <h3>Автор</h3>
              <div className="watch-channel-card">
                <Avatar 
                  src={video.channel.avatar}
                  alt={video.channel.username}
                  username={video.channel.username}
                  size="medium"
                />
                <div className="watch-channel-info">
                  <p className="watch-channel-name">{video.channel.username}</p>
                  {video.channel.bio && (
                    <p className="watch-channel-bio">{video.channel.bio}</p>
                  )}
                </div>
                {currentUser && currentUser.id !== video.channel.user_id && (
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

        {/* Правая сторона: комментарии */}
        <div className="watch-sidebar">
          <VideoComments videoId={videoId} />
        </div>
      </div>

      {/* Снизу: похожие видео */}
      <div className="watch-related-wrapper">
        <RelatedStreams currentStreamKey={videoId} isVideo={true} />
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

export default WatchVideoPage;
