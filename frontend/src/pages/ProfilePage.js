import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StreamModal from '../components/StreamModal';
import ScheduleModal from '../components/ScheduleModal';
import ScheduleList from '../components/ScheduleList';
import ScheduleView from '../components/ScheduleView';
import LiveStreamPlayer from '../components/LiveStreamPlayer';
import '../styles/Profile.css';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
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

  // Данные для разделов
  const [streams, setStreams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  // Состояние для модалки стрима
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [editingStream, setEditingStream] = useState(null);
  const [streamModalLoading, setStreamModalLoading] = useState(false);

  // Состояние для модалки расписания
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchStreamKey();
    } else if (activeTab === 'streams') {
      fetchStreams();
      fetchStreamKey();
    } else if (activeTab === 'videos') {
      fetchVideos();
    } else if (activeTab === 'schedule') {
      fetchSchedule();
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    }
  }, [activeTab]);

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
      // Используем эндпоинт для получения ВСЕх стримов (включая не-live)
      const streamsResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/streams/channel/${channel.id}/all`,
        {
          credentials: 'include'
        }
      );

      if (streamsResponse.ok) {
        const data = await streamsResponse.json();
        console.log('=== STREAMS FETCHED ===');
        console.log('Streams data:', data);
        if (data.length > 0) {
          console.log('First stream:', data[0]);
          console.log('First stream channel:', data[0].channel);
          console.log('First stream channel.stream_key:', data[0].channel?.stream_key);
        }
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
      setScheduleLoading(true);
      const channel = await getUserChannel();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/schedules/channel/${channel.id}`,
        {
          credentials: 'include'
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else if (response.status === 404) {
        setSchedule([]);
      }
    } catch (err) {
      console.error('Ошибка при загрузке расписания:', err);
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/subscriptions/user/subscriptions`,
        {
          credentials: 'include'
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      } else if (response.status === 404) {
        console.warn('Subscriptions endpoint not available');
      }
    } catch (err) {
      console.error('Ошибка при загрузке подписок:', err);
    }
  };

  const handleScheduleSave = async (scheduleData) => {
    try {
      setScheduleLoading(true);
      const channel = await getUserChannel();
      
      let response;
      if (editingSchedule) {
        // Обновление расписания
        response = await fetch(
          `${process.env.REACT_APP_API_URL}/schedules/${editingSchedule.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              title: scheduleData.title,
              description: scheduleData.description,
              scheduled_at: scheduleData.scheduled_at
            })
          }
        );
      } else {
        // Создание нового расписания
        response = await fetch(
          `${process.env.REACT_APP_API_URL}/schedules`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              channel_id: channel.id,
              title: scheduleData.title,
              description: scheduleData.description,
              scheduled_at: scheduleData.scheduled_at
            })
          }
        );
      }

      if (response.ok) {
        setIsScheduleModalOpen(false);
        setEditingSchedule(null);
        setSuccess(editingSchedule ? 'Расписание обновлено!' : 'Расписание создано!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchSchedule();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Ошибка при сохранении расписания');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Ошибка при сохранении расписания:', err);
      setError('Ошибка при сохранении расписания');
      setTimeout(() => setError(''), 3000);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleScheduleDelete = async (scheduleId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это расписание?')) {
      return;
    }

    try {
      setScheduleLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/schedules/${scheduleId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        setSuccess('Расписание удалено!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchSchedule();
      } else {
        setError('Ошибка при удалении расписания');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Ошибка при удалении расписания:', err);
      setError('Ошибка при удалении расписания');
      setTimeout(() => setError(''), 3000);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleScheduleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  const handleScheduleCreate = () => {
    setEditingSchedule(null);
    setIsScheduleModalOpen(true);
  };

  const handleUnsubscribeChannel = async (channelId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/subscriptions/${channelId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        setSubscriptions(subscriptions.filter(s => s.id !== channelId));
        setSuccess('Вы отписались от канала');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Ошибка при отписке:', err);
      setError('Ошибка при отписке');
      setTimeout(() => setError(''), 3000);
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

  const handleWatchStream = (stream) => {
    // Получаем stream_key из channel
    console.log('🎮 handleWatchStream called with stream:', stream);
    console.log('🎮 stream.id:', stream.id);
    console.log('🎮 stream.channel:', stream.channel);
    console.log('🎮 stream.channel?.stream_key:', stream.channel?.stream_key);
    
    const streamKeyToUse = stream.channel?.stream_key;
    if (streamKeyToUse) {
      console.log('✅ Opening stream:', streamKeyToUse);
      navigate(`/watch/${streamKeyToUse}`);
    } else {
      console.error('❌ No stream key found in stream.channel:', stream.channel);
      setError('Не удалось открыть стрим: отсутствует ключ стрима');
    }
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

        <div className="profile-tabs">
          <button
            className={activeTab === 'streams' ? 'active' : ''}
            onClick={() => setActiveTab('streams')}
          >
            Стримы
          </button>
          <button
            className={activeTab === 'subscriptions' ? 'active' : ''}
            onClick={() => setActiveTab('subscriptions')}
          >
            Мои подписки
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
          
          {schedule.length > 0 && (
            <ScheduleView schedules={schedule} isLoading={scheduleLoading} compact={true} />
          )}
          
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
                <div key={stream.id} className="stream-large-card" onClick={() => handleWatchStream(stream)} style={{cursor: 'pointer'}}>
                  <div className="stream-large-thumbnail">
                    {stream.is_live ? (
                      // Показываем кастомный HLS плеер если стрим активен
                      <LiveStreamPlayer
                        streamKey={stream.channel?.stream_key || streamKey}
                        onError={(error) => console.error('Stream error:', error)}
                      />
                    ) : (
                      // Показываем превью если стрим оффлайн
                      <img src={stream.thumbnail_url ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${stream.thumbnail_url}` : '/default-stream.jpg'} alt={stream.title} />
                    )}
                    <div className="stream-large-status">{stream.is_live ? 'LIVE' : 'OFFLINE'}</div>
                    <div className="stream-large-actions">
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(stream);
                        }}
                        title="Редактировать"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStream(stream.id);
                        }}
                        title="Удалить"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            <button 
              className="btn-white"
              onClick={handleScheduleCreate}
            >
              Добавить событие
            </button>
          </div>
          
          <ScheduleList 
            schedules={schedule}
            onEdit={handleScheduleEdit}
            onDelete={handleScheduleDelete}
            isLoading={scheduleLoading}
          />
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

      {activeTab === 'subscriptions' && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Мои подписки</h2>
          </div>

          {subscriptions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Вы не подписаны ни на какие каналы</h3>
              <p>Подпишитесь на каналы создателей, чтобы следить за их стримами</p>
            </div>
          ) : (
            <div className="subscriptions-grid">
              {subscriptions.map(channel => {
                const avatarUrl = channel.user?.avatar_url ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${channel.user.avatar_url}` : null;
                const initials = channel.user?.username ? channel.user.username.charAt(0).toUpperCase() : 'U';
                
                return (
                  <div key={channel.id} className="subscription-card">
                    <div className="subscription-header">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={channel.user?.username}
                          className="subscription-avatar"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="subscription-avatar-placeholder"
                        style={{ display: avatarUrl ? 'none' : 'flex' }}
                      >
                        {initials}
                      </div>
                      <div className="subscription-info">
                        <h3 
                          className="subscription-name-link"
                          onClick={() => navigate(`/${channel.user?.username}`)}
                        >
                          {channel.user?.full_name || channel.user?.username}
                        </h3>
                        <p className="subscription-username">@{channel.user?.username}</p>
                        <p className="subscription-description">{channel.user?.bio || 'Нет описания'}</p>
                      </div>
                    </div>
                    <div className="subscription-actions">
                      <button
                        className="btn-unsubscribe-gray"
                        onClick={() => handleUnsubscribeChannel(channel.id)}
                      >
                        Отписаться
                      </button>
                    </div>
                  </div>
                );
              })}
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

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        schedule={editingSchedule}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleScheduleSave}
        onDelete={handleScheduleDelete}
        isLoading={scheduleLoading}
      />
    </div>
  );
};
