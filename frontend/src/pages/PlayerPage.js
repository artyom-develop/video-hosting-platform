import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Player.css';

export const PlayerPage = ({ streamId }) => {
  const { token } = useAuth();
  const [stream, setStream] = useState(null);
  const [streamStatus, setStreamStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStreamData();
    const interval = setInterval(fetchStreamStatus, 5000);
    return () => clearInterval(interval);
  }, [streamId]);

  const fetchStreamData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/streams/${streamId || 1}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) throw new Error('Ошибка при получении информации о потоке');
      const data = await response.json();
      setStream(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamStatus = async () => {
    if (!streamId) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/streams/${streamId || 1}/status`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStreamStatus(data);
      }
    } catch (err) {
      console.error('Error fetching stream status:', err);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="player-container">Загрузка видеоплеера...</div>;
  }

  return (
    <div className="player-container">
      {error && <div className="error-message">{error}</div>}

      {stream && (
        <div className="player-wrapper">
          {/* Обложка видео или плеер */}
          <div className="video-player-section">
            {streamStatus?.is_live ? (
              <div className="live-player">
                <div className="player-placeholder">
                  <div className="live-indicator">
                    <span className="live-dot"></span>
                    LIVE
                  </div>
                  <p>HLS поток: http://localhost:8080/hls/stream_{stream.id}.m3u8</p>
                  <video
                    width="100%"
                    height="100%"
                    controls
                    poster={stream.cover_image_url || stream.thumbnail_url}
                  >
                    <source
                      src={`http://localhost:8080/hls/stream_${stream.id}.m3u8`}
                      type="application/x-mpegURL"
                    />
                    Ваш браузер не поддерживает видео плеер.
                  </video>
                </div>
              </div>
            ) : (
              <div className="cover-image">
                {stream.cover_image_url ? (
                  <img src={stream.cover_image_url} alt={stream.title} />
                ) : (
                  <div className="placeholder-cover">
                    <div className="placeholder-content">
                      <h1>Трансляция не активна</h1>
                      <p>Обложка видео будет отображена здесь</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Информация о потоке */}
          <div className="stream-info-section">
            <div className="stream-header">
              <h1>{stream.title}</h1>
              {streamStatus?.is_live && (
                <span className="live-badge">
                  <span className="pulse"></span>
                  В ЭФИРЕ
                </span>
              )}
            </div>

            <div className="stream-stats">
              <div className="stat-item">
                <span className="label">Просмотров:</span>
                <span className="value">{stream.view_count.toLocaleString()}</span>
              </div>

              {streamStatus && (
                <>
                  <div className="stat-item">
                    <span className="label">Зрителей сейчас:</span>
                    <span className="value">{streamStatus.viewers_count}</span>
                  </div>

                  <div className="stat-item">
                    <span className="label">Длительность:</span>
                    <span className="value">
                      {formatDuration(streamStatus.duration)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {stream.description && (
              <div className="stream-description">
                <h3>Описание</h3>
                <p>{stream.description}</p>
              </div>
            )}

            {streamStatus?.started_at && (
              <div className="stream-timestamps">
                <p>
                  <strong>Начало трансляции:</strong>{' '}
                  {new Date(streamStatus.started_at).toLocaleString('ru-RU')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!stream && !error && (
        <div className="no-stream">
          <p>Видео не найдено</p>
        </div>
      )}
    </div>
  );
};

export default PlayerPage;
