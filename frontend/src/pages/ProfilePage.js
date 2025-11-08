import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Profile.css';

export const ProfilePage = () => {
  const { user, token } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [streamKey, setStreamKey] = useState('');
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (activeTab === 'stream-key') {
      fetchStreamKey();
    }
  }, [activeTab]);

  const fetchStreamKey = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/channels/1/stream-key?user_id=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
            Authorization: `Bearer ${token}`,
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
          headers: { Authorization: `Bearer ${token}` },
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
    <div className="profile-container">
      <div className="profile-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Профиль
        </button>
        <button
          className={activeTab === 'stream-key' ? 'active' : ''}
          onClick={() => setActiveTab('stream-key')}
        >
          Ключ потока
        </button>
        <button
          className={activeTab === 'docs' ? 'active' : ''}
          onClick={() => setActiveTab('docs')}
        >
          Документация
        </button>
      </div>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      {activeTab === 'profile' && (
        <div className="profile-form-section">
          <h2>Редактирование профиля</h2>
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label>Имя пользователя (не изменяется)</label>
              <input type="text" value={user?.username} disabled />
            </div>

            <div className="form-group">
              <label>Email (не изменяется)</label>
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
              <label>Описание профиля (био)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows="4"
                placeholder="Расскажите о себе..."
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Сохранение...' : 'Сохранить профиль'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'stream-key' && (
        <div className="stream-key-section">
          <h2>Управление ключом потока для OBS</h2>
          <div className="stream-key-info">
            <p className="info-text">
              Используйте этот ключ и RTMP адрес для трансляции в OBS Studio
            </p>

            <div className="config-box">
              <h3>RTMP URL для OBS:</h3>
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
              <h3>Stream Key:</h3>
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
              <h3>Инструкции для OBS:</h3>
              <ol>
                <li>Откройте OBS Studio</li>
                <li>Settings → Stream</li>
                <li>Service: Custom</li>
                <li>Вставьте RTMP URL выше</li>
                <li>Вставьте Stream Key выше</li>
                <li>Нажмите "Start Streaming"</li>
              </ol>
            </div>

            <button
              onClick={handleRegenerateKey}
              disabled={loading}
              className="btn-danger"
            >
              {loading ? 'Переген...' : 'Переген. ключ потока'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="docs-section">
          <h2>Нормативные документы</h2>
          <div className="docs-list">
            <div className="doc-item">
              <h3>Условия использования</h3>
              <p>Согласитесь с условиями перед использованием платформы</p>
              <a href="/docs/terms-of-service" target="_blank" rel="noopener noreferrer">
                Читать полный текст →
              </a>
            </div>

            <div className="doc-item">
              <h3>Политика конфиденциальности</h3>
              <p>Узнайте как мы защищаем ваши личные данные</p>
              <a href="/docs/privacy-policy" target="_blank" rel="noopener noreferrer">
                Читать полный текст →
              </a>
            </div>

            <div className="doc-item">
              <h3>Руководство по контенту</h3>
              <p>Правила и рекомендации по загрузке контента</p>
              <a href="/docs/content-guidelines" target="_blank" rel="noopener noreferrer">
                Читать полный текст →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
