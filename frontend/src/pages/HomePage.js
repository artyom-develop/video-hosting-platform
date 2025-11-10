import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Home.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liveStreams, setLiveStreams] = useState([]);
  const [allStreams, setAllStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const liveResponse = await api.get('/streams?is_live=true');
        const allResponse = await api.get('/streams');
        
        setLiveStreams(liveResponse.data || []);
        setAllStreams(allResponse.data || []);
      } catch (err) {
        setError('Error loading streams');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = [
    {
      id: 'gaming',
      name: 'Игры',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21.2206 8C20.5311 5.81603 19.4281 4.63486 18.0908 4.16059C17.7099 4.02549 17.3016 4 16.8974 4H16.2849C15.4074 4 14.5514 4.27225 13.8351 4.77922L13.3332 5.13441C12.9434 5.41029 12.4776 5.55844 12 5.55844C11.5225 5.55844 11.0567 5.41029 10.6669 5.13443L10.165 4.77922C9.44862 4.27225 8.59264 4 7.71504 4H7.10257C6.69838 4 6.29009 4.02549 5.90915 4.16059C3.52645 5.00566 1.88749 8.09504 2.00604 15.1026C2.02992 16.5145 2.3603 18.075 3.63423 18.6842C4.03121 18.8741 4.49667 19 5.02671 19C5.66273 19 6.1678 18.8187 6.55763 18.5632C7.47153 17.9642 8.14122 16.9639 9.11125 16.4609C9.69519 16.1581 10.3434 16 11.0011 16H12.9989C13.6566 16 14.3048 16.1581 14.8888 16.4609C15.8588 16.9639 16.5285 17.9642 17.4424 18.5632C17.8322 18.8187 18.3373 19 18.9733 19C19.5033 19 19.9688 18.8741 20.3658 18.6842C21.6397 18.075 21.9701 16.5145 21.994 15.1026C22.0132 13.9681 21.9863 12.9362 21.9176 12"/>
          <path d="M7.5 9V12M6 10.5L9 10.5"/>
          <circle cx="18.25" cy="10.25" r="0.75"/>
          <circle cx="15.25" cy="10.25" r="0.75"/>
          <circle cx="16.75" cy="8.75" r="0.75"/>
          <circle cx="16.75" cy="11.75" r="0.75"/>
        </svg>
      )
    },
    { 
      id: 'music', 
      name: 'Музыка', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      )
    },
    { 
      id: 'creative', 
      name: 'Творчество', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 3l3.5 14.5L13 18l5-5z"/>
          <path d="M2 3l7.586 7.586"/>
          <circle cx="11" cy="11" r="2"/>
        </svg>
      )
    },
    { 
      id: 'talk', 
      name: 'Беседы', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    {
      id: 'sports',
      name: 'Спорт',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.1801 18C19.5801 18 20.1801 16.65 20.1801 15V9C20.1801 7.35 19.5801 6 17.1801 6C14.7801 6 14.1801 7.35 14.1801 9V15C14.1801 16.65 14.7801 18 17.1801 18Z"/>
          <path d="M6.81995 18C4.41995 18 3.81995 16.65 3.81995 15V9C3.81995 7.35 4.41995 6 6.81995 6C9.21995 6 9.81995 7.35 9.81995 9V15C9.81995 16.65 9.21995 18 6.81995 18Z"/>
          <path d="M9.81995 12H14.1799"/>
          <path d="M22.5 14.5V9.5"/>
          <path d="M1.5 14.5V9.5"/>
        </svg>
      )
    },
    { 
      id: 'chat', 
      name: 'Разговоры', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
  ];

  const filters = [
    { id: 'all', label: 'Все' },
    { id: 'following', label: 'Мои' },
    { id: 'new', label: 'Новое' },
    { id: 'trending', label: 'Тренды' },
  ];

  const handleStartStreaming = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleStreamClick = (streamId) => {
    navigate(`/watch/${streamId}`);
  };

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="banner-background">
          <div className="banner-gradient"></div>
        </div>
        <div className="banner-content">
          <div className="banner-text">
            <h1>Откройте прямые трансляции</h1>
            <p>Смотрите любимых создателей в реальном времени</p>
            <button className="banner-button" onClick={handleStartStreaming}>
              {user ? '▶ Начать трансляцию' : '▶ Перейти в эфир'}
            </button>
          </div>
          <div className="banner-stats">
            <div className="stat">
              <span className="stat-value">50K+</span>
              <span className="stat-label">Прямо сейчас</span>
            </div>
            <div className="stat">
              <span className="stat-value">2M+</span>
              <span className="stat-label">Зрители</span>
            </div>
            <div className="stat">
              <span className="stat-value">24/7</span>
              <span className="stat-label">Развлечение</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="filter-section">
        <div className="filter-container">
          <div className="filter-buttons">
            {filters.map(f => (
              <button
                key={f.id}
                className={`filter-btn ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-carousel">
        <div className="carousel-container">
          <h2 className="section-heading">Категории</h2>
          <div className="categories-scroll">
            {categories.map(cat => (
              <div key={cat.id} className="category-chip">
                <span className="chip-icon">{cat.icon}</span>
                <span className="chip-name">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      {loading ? (
        <section className="streams-section">
          <div className="loading-message">
            <div className="spinner"></div>
            <p>Загрузка трансляций...</p>
          </div>
        </section>
      ) : error ? (
        <section className="streams-section">
          <div className="error-message">
            <p>{error}</p>
          </div>
        </section>
      ) : (
        <>
          {/* Live Streams */}
          {liveStreams.length > 0 && (
            <section className="featured-section">
              <div className="section-header">
                <h2 className="section-heading">🔴 Прямо сейчас в эфире</h2>
                <span className="live-count">{liveStreams.length}</span>
              </div>
              
              <div className="streams-grid featured">
                {liveStreams.slice(0, 4).map(stream => (
                  <div
                    key={stream.id}
                    className="stream-card featured"
                    onClick={() => handleStreamClick(stream.id)}
                  >
                    <div className="card-image">
                      {stream.thumbnail_url ? (
                        <img src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${stream.thumbnail_url}`} alt={stream.title} />
                      ) : (
                        <div className="image-placeholder">📹</div>
                      )}
                      <div className="live-indicator">
                        <span className="live-pulse"></span>
                        ПРЯМО
                      </div>
                      <div className="viewers-badge">
                        👁️ {(stream.view_count || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="streamer-info">
                        <div className="avatar">
                          {stream.profile_image ? (
                            <img src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${stream.profile_image}`} alt={stream.creator_name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {(stream.creator_name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="streamer-details">
                          <h3 className="stream-title">{stream.title}</h3>
                          <p className="streamer-name">{stream.creator_name || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All Streams */}
          {allStreams.length > 0 && (
            <section className="trending-section">
              <div className="section-header">
                <h2 className="section-heading">🔥 Популярное</h2>
              </div>
              
              <div className="streams-grid">
                {allStreams.slice(0, 12).map(stream => (
                  <div
                    key={stream.id}
                    className="stream-card"
                    onClick={() => handleStreamClick(stream.id)}
                  >
                    <div className="card-image">
                      {stream.thumbnail_url ? (
                        <img src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${stream.thumbnail_url}`} alt={stream.title} />
                      ) : (
                        <div className="image-placeholder">📹</div>
                      )}
                      {stream.is_live && (
                        <div className="live-indicator compact">
                          <span className="live-pulse"></span>
                          LIVE
                        </div>
                      )}
                      <div className="viewers-badge">
                        👁️ {(stream.view_count || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="streamer-info">
                        <div className="avatar small">
                          {stream.profile_image ? (
                            <img src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${stream.profile_image}`} alt={stream.creator_name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {(stream.creator_name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="streamer-details">
                          <h3 className="stream-title">{stream.title}</h3>
                          <p className="streamer-name">{stream.creator_name || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

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

export default HomePage;
