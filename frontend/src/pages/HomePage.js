import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

export const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterLive, setFilterLive] = useState(true);

  useEffect(() => {
    fetchStreams();
  }, [filterLive]);

  const fetchStreams = async () => {
    setLoading(true);
    setError('');
    try {
      const query = filterLive ? '?is_live=true' : '';
      const response = await api.get(`/channels${query}`);
      setStreams(response.data);
    } catch (err) {
      setError('Ошибка при загрузке потоков');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="home-hero">
        <div className="hero-content">
          <h1>Добро пожаловать на XaTube</h1>
          <p>Платформа видеотрансляции нового поколения</p>
          {!user && (
            <div className="hero-buttons">
              <button
                className="hero-button primary"
                onClick={() => navigate('/register')}
              >
                Создать аккаунт
              </button>
              <button
                className="hero-button secondary"
                onClick={() => navigate('/login')}
              >
                Вход
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Фильтры */}
      <div className="home-filters">
        <div className="filter-buttons">
          <button
            className={`filter-button ${!filterLive ? 'active' : ''}`}
            onClick={() => setFilterLive(false)}
          >
            📹 Все трансляции
          </button>
          <button
            className={`filter-button ${filterLive ? 'active' : ''}`}
            onClick={() => setFilterLive(true)}
          >
            🔴 В эфире
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="home-content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-message">Загрузка потоков...</div>
        ) : streams.length === 0 ? (
          <div className="empty-message">
            <p>Нет доступных трансляций</p>
            {user && (
              <p style={{ marginTop: '10px', fontSize: '14px' }}>
                <button
                  style={{
                    color: '#ff6b6b',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                  }}
                  onClick={() => navigate('/profile')}
                >
                  Начните свою трансляцию
                </button>
              </p>
            )}
          </div>
        ) : (
          <div className="streams-grid">
            {streams.map((stream) => (
              <div
                key={stream.id}
                className="stream-card"
                onClick={() => navigate(`/player/${stream.id}`)}
              >
                <div className="stream-thumbnail">
                  {stream.cover_image_url || stream.thumbnail_url ? (
                    <img
                      src={stream.cover_image_url || stream.thumbnail_url}
                      alt={stream.title}
                    />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <span>Нет обложки</span>
                    </div>
                  )}
                  {stream.is_live && (
                    <div className="live-badge">
                      <span className="live-dot"></span>
                      LIVE
                    </div>
                  )}
                </div>

                <div className="stream-info">
                  <h3 className="stream-title">{stream.title}</h3>
                  <p className="stream-description">{stream.description}</p>

                  <div className="stream-stats">
                    <span className="stat">
                      👥 {stream.viewers_count} зрителей
                    </span>
                    <span className="stat">
                      👁️ {stream.view_count} просмотров
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
