import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import StreamModal from '../components/StreamModal';
import '../styles/Profile.css';

// Импорт HLS плеера
let Hls = null;
if (typeof window !== 'undefined') {
  import('hls.js').then(module => {
    Hls = module.default;
  }).catch(err => {
    console.warn('hls.js not available:', err);
  });
}

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarFileRef = useRef(null);
  const [streamKey, setStreamKey] = useState('');
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('streams');

  // Состояние для превью стрима
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamError, setStreamError] = useState('');
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const streamCheckIntervalRef = useRef(null);

  // Данные для разделов
  const [streams, setStreams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [schedule, setSchedule] = useState([]);

  // Состояние для модалки стрима
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [editingStream, setEditingStream] = useState(null);
  const [streamModalLoading, setStreamModalLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchStreamKey();
    } else if (activeTab === 'streams') {
      fetchStreams();
      fetchStreamKey(); // Загружаем ключ для проверки стрима
      checkStreamStatus(); // Проверяем статус стрима при загрузке
    } else if (activeTab === 'videos') {
      fetchVideos();
    } else if (activeTab === 'schedule') {
      fetchSchedule();
    }
  }, [activeTab]);

  // Проверка статуса стрима каждые 10 секунд
  useEffect(() => {
    if (activeTab === 'streams' && streamKey) {
      console.log('Setting up stream check interval with key:', streamKey);
      checkStreamStatus(); // Проверяем сразу
      streamCheckIntervalRef.current = setInterval(checkStreamStatus, 10000); // Проверка каждые 10 секунд
    } else {
      clearInterval(streamCheckIntervalRef.current);
    }

    return () => {
      clearInterval(streamCheckIntervalRef.current);
    };
  }, [activeTab, streamKey]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      destroyStreamPlayer();
      clearInterval(streamCheckIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    console.log('=== USER CHANGED ===');
    console.log('User data:', user);
    if (user?.avatar_url) {
      console.log('Avatar URL:', user.avatar_url);
      console.log('Full avatar URL:', `${process.env.REACT_APP_API_URL.replace('/api', '')}${user.avatar_url}`);
    }
  }, [user]);

  const fetchStreams = async () => {
    try {
      // Получаем канал пользователя (создаем если нужно)
      const channel = await getUserChannel();
      const streamsResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/streams?channel_id=${channel.id}`,
        {
          credentials: 'include'
        }
      );

      if (streamsResponse.ok) {
        const data = await streamsResponse.json();
        setStreams(data);
      } else {
        setStreams([]);
      }
    } catch (err) {
      console.error('Ошибка при загрузке стримов:', err);
      setStreams([]);
    }
  };

  const getUserChannel = async () => {
    try {
      console.log('getUserChannel: user.id =', user.id, 'type:', typeof user.id);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/${user.id}/channels`,
        {
          credentials: 'include'
        }
      );

      console.log('getUserChannel response status:', response.status);
      console.log('getUserChannel response ok:', response.ok);

      if (response.ok) {
        const channels = await response.json();
        console.log('getUserChannel: received channels:', channels);
        if (channels.length > 0) {
          console.log('getUserChannel: returning existing channel:', channels[0]);
          return channels[0];
        }
      } else {
        console.log('getUserChannel: response not ok, status:', response.status);
        const errorText = await response.text();
        console.log('getUserChannel: error response:', errorText);
      }
      
      // Если канал не найден, создаем новый канал
      console.log('Канал не найден, создаем новый канал для пользователя');
      const createResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/channels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `${user.username}'s Channel`,
            description: `Channel for ${user.username}`,
            thumbnail_url: null
          }),
          credentials: 'include'
        }
      );

      console.log('createChannel response status:', createResponse.status);
      console.log('createChannel response ok:', createResponse.ok);

      if (createResponse.ok) {
        const newChannel = await createResponse.json();
        console.log('Канал создан:', newChannel);
        return newChannel;
      } else {
        console.error('Не удалось создать канал');
        const errorText = await createResponse.text();
        console.error('Create channel error:', errorText);
        // В случае ошибки возвращаем объект с id пользователя
        return { id: user.id };
      }
    } catch (err) {
      console.error('Ошибка при получении/создании канала:', err);
      // В случае ошибки возвращаем объект с id пользователя
      return { id: user.id };
    }
  };

  const handleCreateStream = async (formData) => {
    setStreamModalLoading(true);
    
    // Debug: log FormData contents
    console.log('Creating stream with FormData:');
    for (let [key, value] of formData.entries()) {
      console.log(`- ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    }
    
    try {
      const channel = await getUserChannel();
      console.log('Using channel:', channel);
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/streams/${channel.id}`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include'
        }
      );

      console.log('Create stream response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create stream error:', errorText);
        throw new Error('Ошибка при создании стрима');
      }

      const result = await response.json();
      console.log('Stream created successfully:', result);
      
      await fetchStreams();
      setSuccess('Стриим успешно создан!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Ошибка при создании стрима:', err);
      setError('Ошибка при создании стрима');
      setTimeout(() => setError(''), 3000);
      throw err;
    } finally {
      setStreamModalLoading(false);
    }
  };

  const handleUpdateStream = async (formData) => {
    if (!editingStream) return;

    setStreamModalLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/streams/${editingStream.id}`,
        {
          method: 'PUT',
          body: formData,
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при обновлении стрима');
      }

      await fetchStreams();
      setSuccess('Стриим успешно обновлен!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Ошибка при обновлении стрима:', err);
      setError('Ошибка при обновлении стрима');
      setTimeout(() => setError(''), 3000);
      throw err;
    } finally {
      setStreamModalLoading(false);
    }
  };

  const handleDeleteStream = async (streamId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/streams/${streamId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при удалении стрима');
      }

      await fetchStreams();
      setSuccess('Стриим успешно удален!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Ошибка при удалении стрима:', err);
      setError('Ошибка при удалении стрима');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openCreateModal = () => {
    if (streams.length > 0) {
      setError('Вы можете создать только один стрим');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setEditingStream(null);
    setIsStreamModalOpen(true);
  };

  const openEditModal = (stream) => {
    setEditingStream(stream);
    setIsStreamModalOpen(true);
  };

  const closeStreamModal = () => {
    setIsStreamModalOpen(false);
    setEditingStream(null);
  };

  const fetchVideos = async () => {
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

  const checkStreamStatus = async () => {
    if (!streamKey) {
      console.log('No stream key available');
      return;
    }

    try {
      const testUrl = `http://localhost/live/${streamKey}.m3u8`;
      console.log('Checking stream availability at:', testUrl);
      
      // Проверяем доступность HLS потока через GET (вместо HEAD, т.к. некоторые серверы это не поддерживают)
      const response = await fetch(testUrl, { 
        method: 'GET',
        cache: 'no-cache'
      });
      console.log('Stream check response:', response.status, response.ok);
      
      if (response.ok) {
        // Поток доступен
        if (!isStreaming) {
          console.log('🟢 Stream is active, initializing player');
          setIsStreaming(true);
          setStreamUrl(testUrl);
          setStreamError('');
          initializeStreamPlayer(testUrl);
        } else {
          console.log('✅ Stream still active');
        }
      } else {
        // Поток недоступен
        if (isStreaming) {
          console.log('🔴 Stream is inactive (HTTP', response.status, ')');
          setIsStreaming(false);
          setStreamUrl('');
          destroyStreamPlayer();
        }
      }
    } catch (err) {
      console.log('Stream check failed:', err.message);
      if (isStreaming) {
        console.log('🔴 Stream check error, marking as inactive');
        setIsStreaming(false);
        setStreamUrl('');
        destroyStreamPlayer();
      }
    }
  };

  const initializeStreamPlayer = (url) => {
    if (!videoRef.current || !Hls) return;

    try {
      // Если плеер уже инициализирован - не создавать новый
      if (hlsRef.current) {
        console.log('HLS player already initialized');
        return;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
          maxBufferHole: 0.5
        });

        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ Stream player initialized');
          setStreamError('');
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ Stream player error:', data);
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Network error, retrying...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Media error, attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal error, destroying player');
                setStreamError('Ошибка загрузки стрима');
                setIsStreaming(false);
                destroyStreamPlayer();
                break;
            }
          }
        });

        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
        videoRef.current.play().catch(err => {
          console.warn('Autoplay failed:', err);
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url;
        videoRef.current.play().catch(err => {
          console.warn('Autoplay failed:', err);
        });
      }
    } catch (err) {
      console.error('Failed to initialize stream player:', err);
      setStreamError('Не удалось инициализировать плеер');
      setIsStreaming(false);
    }
  };

  const destroyStreamPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const fetchStreamKey = async () => {
    try {
      console.log('Fetching stream key...');
      
      // Сначала пробуем получить через роут /channels/my
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/channels/my`,
          {
            credentials: 'include'
          }
        );
        
        if (response.ok) {
          const channel = await response.json();
          console.log('Got channel from /channels/my:', channel);
          console.log('Stream key:', channel.stream_key);
          setStreamKey(channel.stream_key);
          return;
        }
      } catch (err) {
        console.log('Failed to fetch from /channels/my:', err.message);
      }

      // Fallback: получаем через getUserChannel
      const channel = await getUserChannel();
      if (!channel) {
        console.warn('No channel found for user');
        return;
      }

      console.log('Channel found:', channel.id, 'Stream key:', channel.stream_key);
      setStreamKey(channel.stream_key);
    } catch (err) {
      console.error('Ошибка при получении ключа потока:', err);
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
            username: username,
            full_name: fullName,
            bio: bio,
          }),
          credentials: 'include'
        }
      );

      if (response.ok) {
        setSuccess('Профиль успешно обновлён!');
        setTimeout(() => setSuccess(''), 3000);
        // Refresh user data to update profile info in UI
        await refreshUser();
      } else {
        throw new Error('Ошибка при обновлении профиля');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file);
      setAvatar(file);
      avatarFileRef.current = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    const fileToUpload = avatarFileRef.current || avatar;

    if (!fileToUpload) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    // Double-check the file is still valid
    if (!(fileToUpload instanceof File)) {
      console.error('File is not a File object:', typeof fileToUpload);
      setError('Ошибка файла');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('=== STARTING AVATAR UPLOAD ===');
      console.log('File to upload:', fileToUpload);

      console.log('File details:');
      console.log('- Name:', fileToUpload.name);
      console.log('- Size:', fileToUpload.size);
      console.log('- Type:', fileToUpload.type);
      console.log('- Last modified:', fileToUpload.lastModified);

      const formData = new FormData();
      formData.append('file', fileToUpload);

      console.log('FormData created. Contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`- ${key}:`, value);
      }

      const apiUrl = `${process.env.REACT_APP_API_URL}/users/${user.id}/avatar`;
      console.log('Sending request to:', apiUrl);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/${user.id}/avatar`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include'
        }
      );

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Success response:', responseData);
        setSuccess('Аватарка успешно обновлена!');
        setTimeout(() => setSuccess(''), 3000);
        setAvatar(null);
        avatarFileRef.current = null;
        setAvatarPreview(null);
        // Refresh user data to update avatar in UI
        await refreshUser();
      } else {
        const errorData = await response.text();
        console.log('Error response status:', response.status);
        console.log('Error response data:', errorData);
        throw new Error(`Ошибка при загрузке аватарки: ${response.status} ${errorData}`);
      }
    } catch (err) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error message:', err.message);
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    setLoading(true);
    setError('');

    try {
      const channel = await getUserChannel();
      if (!channel) {
        setError('Канал не найден');
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/channels/${channel.id}/regenerate-stream-key`,
        {
          method: 'POST',
          credentials: 'include'
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
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="avatar-image" />
            ) : user?.avatar_url ? (
              (() => {
                const fullUrl = `${process.env.REACT_APP_API_URL.replace('/api', '')}${user.avatar_url}`;
                console.log('=== AVATAR IMAGE RENDER ===');
                console.log('Avatar URL from user:', user.avatar_url);
                console.log('API URL base:', process.env.REACT_APP_API_URL);
                console.log('Full avatar URL:', fullUrl);
                return (
                  <img 
                    src={fullUrl} 
                    alt="Avatar" 
                    className="avatar-image"
                    onError={(e) => {
                      console.log('❌ Avatar image failed to load');
                      console.log('Failed URL:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      console.log('✅ Avatar image loaded successfully');
                      console.log('Loaded URL:', e.target.src);
                    }}
                  />
                );
              })()
            ) : (
              user?.username ? user.username.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div className="profile-info">
            <h1>{fullName || username}</h1>
            <p className="profile-username">@{username}</p>
            <p className="profile-bio">{bio || 'Нет описания'}</p>
          </div>
          <button
            className="btn-edit-profile"
            onClick={() => setActiveTab('settings')}
          >
            Изменить
          </button>
        </div>

        {/* Превью стрима */}
        <div className="stream-preview-section">
          {isStreaming ? (
            <div className="live-stream-preview">
              <div className="live-indicator">
                <span className="live-dot"></span>
                LIVE - Трансляция активна
              </div>
              <div className="stream-player-container">
                <video
                  ref={videoRef}
                  className="stream-preview-video"
                  autoPlay
                  muted
                  playsInline
                />
                {streamError && (
                  <div className="stream-error-overlay">
                    {streamError}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="stream-preview-placeholder">
              <div className="preview-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>Стрим не активен</h3>
              <p>Запустите OBS с вашим ключом стримов, чтобы начать трансляцию</p>
              {streamKey && (
                <div className="stream-key-display">
                  <span>Ваш ключ: <code>{streamKey}</code></span>
                  <button 
                    className="btn-copy-key"
                    onClick={() => copyToClipboard(streamKey)}
                    title="Копировать ключ"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
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
              <button className="btn-white" onClick={openCreateModal}>Создать стрим</button>
            </div>
          ) : (
            <div className="streams-container">
              {streams.map(stream => (
                <div key={stream.id} className="stream-large-card">
                  <div className="stream-large-thumbnail">
                    {stream.is_live ? (
                      // Показываем HLS плеер если стрим активен
                      <div className="stream-live-player">
                        <video
                          ref={el => {
                            if (el && el !== videoRef.current && stream.id === streams[0]?.id) {
                              videoRef.current = el;
                              // Инициализируем плеер для первого активного стрима
                              const hlsUrl = `http://localhost/live/${streamKey}.m3u8`;
                              if (Hls && Hls.isSupported()) {
                                if (!hlsRef.current || hlsRef.current.destroyed) {
                                  const hls = new Hls({
                                    enableWorker: false,
                                    lowLatencyMode: true,
                                    backBufferLength: 90,
                                    maxBufferLength: 30
                                  });
                                  hlsRef.current = hls;
                                  hls.loadSource(hlsUrl);
                                  hls.attachMedia(el);
                                  el.play().catch(() => {});
                                }
                              }
                            }
                          }}
                          className="stream-video"
                          controls
                          autoPlay
                          muted
                        />
                      </div>
                    ) : (
                      // Показываем превью если стрим оффлайн
                      <img src={stream.thumbnail_url ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${stream.thumbnail_url}` : '/default-stream.jpg'} alt={stream.title} />
                    )}
                    <div className="stream-large-status">{stream.is_live ? 'LIVE' : 'OFFLINE'}</div>
                    <div className="stream-large-actions">
                      <button
                        className="btn-icon"
                        onClick={() => openEditModal(stream)}
                        title="Редактировать"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDeleteStream(stream.id)}
                        title="Удалить"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </div>
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
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
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

            {/* Загрузка аватарки */}
            <div className="settings-card">
              <h3>Аватарка</h3>
              <div className="avatar-upload-section">
                <div className="current-avatar">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="avatar-preview" />
                  ) : (
                    <div className="avatar-placeholder-large">
                      {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <div className="avatar-upload-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    id="avatar-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="avatar-input" className="btn-secondary">
                    Выбрать файл
                  </label>
                  {avatar && (
                    <button
                      onClick={handleUploadAvatar}
                      disabled={loading}
                      className="btn-white"
                    >
                      {loading ? 'Загрузка...' : 'Загрузить'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Ключ трансляции */}
            <div className="settings-card">
              <h3>Ключ трансляции</h3>
              <div className="stream-key-info">
                <p>Используйте этот ключ для трансляции в OBS Studio</p>

                <div className="config-box">
                  <h4>RTMP URL:</h4>
                  <div className="config-row">
                    <code className="config-code">rtmp://{window.location.hostname}/live</code>
                    <button
                      className="btn-copy"
                      onClick={() => copyToClipboard(`rtmp://${window.location.hostname}/live`)}
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

      <StreamModal
        isOpen={isStreamModalOpen}
        onClose={closeStreamModal}
        onSave={editingStream ? handleUpdateStream : handleCreateStream}
        stream={editingStream}
        isLoading={streamModalLoading}
      />
    </div>
  );
};
