import React, { useState, useEffect, useRef } from 'react';
import '../styles/TestStream.css';
import { channelAPI, rtmpAPI } from '../services/api';

let Hls = null;

// Динамический импорт hls.js
if (typeof window !== 'undefined') {
  import('hls.js').then(module => {
    Hls = module.default;
  }).catch(err => {
    console.warn('hls.js not available:', err);
  });
}

const TestStreamPage = () => {
  // SVG иконки
  const playIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
  const pauseIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  );
  const volumeHighIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  );
  const volumeLowIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
    </svg>
  );
  const volumeMuteIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24zm-6.5 0c0 .83.26 1.65.7 2.29l1.55-1.55c-.05-.08-.1-.16-.15-.25-.09 0-.17-.01-.24-.01zM4 17h2.23l1.52-1.52C6.25 15.61 6 15.8 6 16c0 1.1.9 2 2 2v2c-2.21 0-4-1.79-4-4zm.45-8.5L3.27 4 2 5.27l.43.43C1.99 5.86 1 6.81 1 8v8c0 1.1.9 2 2 2h2l5 5V7.28L6.73 9.73 5.55 8.5zM21 12c0 1.66-1.34 3-3 3-.62 0-1.19-.19-1.67-.5l1.88-1.88c.06.17.79.38.79.38zm-3-9v1.61l-2.48 2.48c.17-.06.35-.09.53-.09 1.66 0 3 1.34 3 3 0 .62-.19 1.19-.5 1.67L18.39 6c.61-.52 1.61-.52 1.61 0z"/>
    </svg>
  );
  const fullscreenIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>
  );
  const cameraIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  );
  const antennaIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 9V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-2c.55 0 1-.45 1-1s-.45-1-1-1V9zm-2 2h-1v2h1v-2zm0-2h-1v2h1V9zm0-2h-1v2h1V7z"/>
    </svg>
  );
  const videoIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  );
  const listIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
    </svg>
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [keyStatus, setKeyStatus] = useState('loading'); // 'loading', 'valid', 'invalid'
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [streamActive, setStreamActive] = useState(true);
  const [lastFragmentTime, setLastFragmentTime] = useState(0);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const streamCheckTimeoutRef = useRef(null);

  // Load user's stream key on component mount
  useEffect(() => {
    const loadStreamKey = async () => {
      try {
        const response = await channelAPI.getMyChannel();
        const key = response.data.stream_key;
        setStreamKey(key);
        setStreamUrl(`http://localhost/live/${key}.m3u8`);
        
        // Проверяем валидность ключа
        try {
          await rtmpAPI.validateStreamKey(key);
          setKeyStatus('valid');
          console.log('✅ Stream key is valid');
        } catch (err) {
          setKeyStatus('invalid');
          console.log('❌ Stream key validation failed:', err.message);
        }
      } catch (err) {
        console.error('Failed to load stream key:', err);
        setKeyStatus('invalid');
        setError('Не удалось загрузить ключ стримов. Пожалуйста, войдите в систему.');
      }
    };

    loadStreamKey();
  }, []);

  const handlePlay = () => {
    setIsPlaying(true);
    setError('');
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoPaused) {
        videoRef.current.play();
        setVideoPaused(false);
      } else {
        videoRef.current.pause();
        setVideoPaused(true);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    setVideoVolume(volume);
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (videoVolume > 0) {
        setVideoVolume(0);
        videoRef.current.volume = 0;
      } else {
        setVideoVolume(0.5);
        videoRef.current.volume = 0.5;
      }
    }
  };

  const handleProgressChange = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().then(() => {
          setIsFullscreen(true);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  const changeQuality = (level) => {
    if (hlsRef.current) {
      if (level === 'auto') {
        hlsRef.current.currentLevel = -1;
      } else {
        hlsRef.current.currentLevel = parseInt(level);
      }
      setSelectedQuality(level);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (!videoPaused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Инициализация HLS плеера
  useEffect(() => {
    const video = videoRef.current;
    if (!isPlaying || !video || !Hls) return;

    console.log('Initializing HLS player...');
    let hls = null;

    try {
      if (Hls && Hls.isSupported()) {
        console.log('Using hls.js');
        hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600
        });

        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest loaded successfully');
          const levels = hls.levels.map((level, index) => ({
            name: `${level.height}p`,
            index: index
          }));
          setQualityLevels(levels);
          setError('');
        });

        hls.on(Hls.Events.FRAGMENT_LOADED, () => {
          console.log('📦 Fragment loaded');
          setLastFragmentTime(Date.now());
          setStreamActive(true);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS error:', data);
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Network error - retrying...');
                if (data.response?.code === 404) {
                  setError(`⚠️ Поток не найден. Запустите OBS с ключом ${streamKey}`);
                } else {
                  setError('❌ Ошибка сети. Проверьте подключение и OBS.');
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Media error - recovering...');
                hls.recoverMediaError();
                break;
              default:
                setError('❌ Ошибка HLS. Убедитесь что OBS активно стримит.');
                break;
            }
          }
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        video.play().catch(err => {
          console.warn('Autoplay prevented:', err);
          setError('⏸️ Нажмите кнопку воспроизведения для запуска потока');
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('Using native HLS (Safari)');
        video.src = streamUrl;
        video.play().catch(err => {
          console.warn('Autoplay prevented:', err);
        });
      } else {
        setError('❌ Ваш браузер не поддерживает HLS. Используйте Chrome, Firefox или Safari.');
      }
    } catch (err) {
      console.error('Fatal error:', err);
      setError('❌ Ошибка инициализации плеера: ' + err.message);
    }

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.src = '';
      }
      clearTimeout(controlsTimeoutRef.current);
      clearTimeout(streamCheckTimeoutRef.current);
    };
  }, [isPlaying, streamUrl]);

  // Проверка активности потока
  useEffect(() => {
    if (!isPlaying || !streamActive) return;

    const checkStreamActivity = () => {
      const now = Date.now();
      const timeSinceLastFragment = now - lastFragmentTime;

      // Если прошло более 5 секунд без нового фрагмента
      if (timeSinceLastFragment > 5000 && lastFragmentTime > 0) {
        console.log('❌ Stream appears to be inactive (no fragments for 5s)');
        setStreamActive(false);
        setError('⚠️ Трансляция завершена. Запустите OBS для возобновления потока.');
        if (videoRef.current) {
          videoRef.current.pause();
          setVideoPaused(true);
        }
      }
    };

    streamCheckTimeoutRef.current = setInterval(checkStreamActivity, 2000);

    return () => {
      clearInterval(streamCheckTimeoutRef.current);
    };
  }, [isPlaying, streamActive, lastFragmentTime]);

  return (
      <div className="test-stream-container">
        <div className="test-stream-header">
          <h1>{cameraIcon} Тестовый стрим</h1>
          <p>Просмотр потока с ключом <strong>{streamKey || 'загрузка...'}</strong></p>
        </div>      <div className="stream-info">
        <div className="info-box">
          <h3>{antennaIcon} RTMP настройки для OBS:</h3>
          <ul>
            <li><strong>Server:</strong> rtmp://localhost:1935/live</li>
            <li><strong>Stream Key:</strong> {streamKey || 'загрузка...'}</li>
          </ul>
          {keyStatus === 'valid' && (
            <div style={{ color: '#4caf50', marginTop: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              ✅ Ключ действителен
            </div>
          )}
          {keyStatus === 'invalid' && (
            <div style={{ color: '#f44336', marginTop: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              ❌ Ключ недействителен
            </div>
          )}
        </div>

        <div className="info-box">
          <h3>{videoIcon} HLS поток:</h3>
          <p><code>{streamUrl}</code></p>
        </div>
      </div>

      <div className="player-section">
        {!isPlaying ? (
          <div className="start-screen">
            <div className="start-content">
              <h2>Готов к просмотру?</h2>
              <p>Запустите трансляцию в OBS с ключом <strong>{streamKey}</strong></p>
              <button onClick={handlePlay} className="play-button" disabled={!streamKey}>
                {playIcon} Начать просмотр
              </button>
            </div>
          </div>
        ) : (
          <div 
            className={`custom-video-player ${isFullscreen ? 'fullscreen' : ''}`}
            ref={containerRef}
            onMouseMove={handleMouseMove}
          >
            {error && (
              <div className="error-message-overlay">
                {error}
              </div>
            )}

            <video
              ref={videoRef}
              className="video-element"
              onPlay={() => setVideoPaused(false)}
              onPause={() => setVideoPaused(true)}
              onTimeUpdate={(e) => setVideoProgress(e.target.currentTime)}
              onDurationChange={(e) => setVideoDuration(e.target.duration)}
              onCanPlay={() => setError('')}
            />

            {videoPaused && !videoProgress && (
              <div className="loading-overlay">
                <div className="loading-spinner">
                  <div className="spinner-circle"></div>
                  <p>Загрузка потока...</p>
                </div>
              </div>
            )}

            <div className="live-badge">
              <span className="live-pulse"></span>
              LIVE - {streamKey}
            </div>

            <div className={`player-controls ${showControls ? 'visible' : 'hidden'}`}>
              <div className="progress-bar-container">
                <input
                  type="range"
                  className="progress-bar"
                  min="0"
                  max={videoDuration || 0}
                  step="0.01"
                  value={videoProgress}
                  onChange={handleProgressChange}
                />
              </div>

              <div className="controls-bottom">
                <div className="controls-left">
                  <button
                    className="control-btn play-pause-btn"
                    onClick={togglePlayPause}
                    title={videoPaused ? 'Воспроизвести' : 'Пауза'}
                  >
                    {videoPaused ? playIcon : pauseIcon}
                  </button>

                  <div className="volume-control">
                    <button
                      className="control-btn volume-btn"
                      onClick={toggleMute}
                      title={videoVolume > 0 ? 'Выключить звук' : 'Включить звук'}
                    >
                      {videoVolume > 0.5 ? volumeHighIcon : videoVolume > 0 ? volumeLowIcon : volumeMuteIcon}
                    </button>
                    <input
                      type="range"
                      className="volume-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      value={videoVolume}
                      onChange={handleVolumeChange}
                    />
                  </div>

                  <span className="time-display">
                    {formatTime(videoProgress)} / {formatTime(videoDuration)}
                  </span>
                </div>

                <div className="controls-right">
                  {qualityLevels.length > 0 && (
                    <div className="quality-selector">
                      <select
                        value={selectedQuality}
                        onChange={(e) => changeQuality(e.target.value)}
                        className="quality-select"
                      >
                        <option value="auto">Авто</option>
                        {qualityLevels.map((level) => (
                          <option key={level.index} value={level.index}>
                            {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    className="control-btn fullscreen-btn"
                    onClick={toggleFullscreen}
                    title="На весь экран"
                  >
                    {fullscreenIcon}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="instructions">
        <h3>{listIcon} Инструкция:</h3>
        <ol>
          <li>Запустите OBS Studio</li>
          <li>В Settings → Stream укажите:
            <ul>
              <li>Service: Custom</li>
              <li>Server: <code>rtmp://localhost:1935/live</code></li>
              <li>Stream Key: <code>mystream</code></li>
            </ul>
          </li>
          <li>Нажмите "Start Streaming" в OBS</li>
          <li>Вернитесь сюда и нажмите "Начать просмотр"</li>
        </ol>
        <p><strong>Ваш персональный ключ стримов:</strong> <code>{streamKey}</code></p>
      </div>
    </div>
  );
};

export default TestStreamPage;
