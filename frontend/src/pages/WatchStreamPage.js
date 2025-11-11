import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LiveStreamPlayer from '../components/LiveStreamPlayer';
import StreamChat from '../components/StreamChat';
import RelatedStreams from '../components/RelatedStreams';
import '../styles/WatchStreamPage.css';

const WatchStreamPage = () => {
  const { streamKey } = useParams();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🎬 WatchStreamPage mounted with streamKey:', streamKey);
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
    } catch (err) {
      console.error('Failed to fetch stream:', err);
      setError('Не удалось загрузить данные стрима');
    } finally {
      setLoading(false);
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
              <p className="watch-description">{stream.description}</p>
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
