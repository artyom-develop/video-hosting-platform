import React, { useState, useEffect, useRef } from 'react';
import '../styles/LiveStreamPlayer.css';

let Hls = null;
if (typeof window !== 'undefined') {
  import('hls.js').then(module => {
    Hls = module.default;
  }).catch(err => {
    console.warn('hls.js not available:', err);
  });
}

const LiveStreamPlayer = ({ streamKey, onError }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const statsIntervalRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lagTime, setLagTime] = useState(0); // Задержка стрима в секундах
  const [error, setError] = useState('');
  const [bufferEnd, setBufferEnd] = useState(0); // Конец буфера (живой край)
  const [currentTime, setCurrentTime] = useState(0); // Текущее время воспроизведения
  const [isBuffering, setIsBuffering] = useState(false); // Идёт ли буферизация
  const progressBarRef = useRef(null);

  // SVG иконки
  const playIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );

  const pauseIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  );

  const volumeHighIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  );

  const volumeLowIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
    </svg>
  );

  const volumeMuteIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24zm-6.5 0c0 .83.26 1.65.7 2.29l1.55-1.55c-.05-.08-.1-.16-.15-.25-.09 0-.17-.01-.24-.01zM4 17h2.23l1.52-1.52C6.25 15.61 6 15.8 6 16c0 1.1.9 2 2 2v2c-2.21 0-4-1.79-4-4zm.45-8.5L3.27 4 2 5.27l.43.43C1.99 5.86 1 6.81 1 8v8c0 1.1.9 2 2 2h2l5 5V7.28L6.73 9.73 5.55 8.5zM21 12c0 1.66-1.34 3-3 3-.62 0-1.19-.19-1.67-.5l1.88-1.88c.06.17.79.38.79.38zm-3-9v1.61l-2.48 2.48c.17-.06.35-.09.53-.09 1.66 0 3 1.34 3 3 0 .62-.19 1.19-.5 1.67L18.39 6c.61-.52 1.61-.52 1.61 0z"/>
    </svg>
  );

  const fullscreenIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>
  );

  // Инициализация плеера
  useEffect(() => {
    if (!streamKey || !isPlaying) return;

    const streamUrl = `${window.location.protocol}//${window.location.host}/live/${streamKey}.m3u8`;
    const video = videoRef.current;

    if (!video) return;

    try {
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          // Параметры буфера для live потока - ОПТИМИЗИРОВАННЫЕ
          backBufferLength: 30,            // 30 сек в прошлое для перемотки
          maxBufferLength: 90,             // 90 сек вперед (больше для плавного воспроизведения)
          maxMaxBufferLength: 120,         // 120 сек абсолютный максимум
          maxBufferSize: 300 * 1000 * 1000, // 300MB макс размер в памяти
          maxBufferHole: 0.25,             // Меньший порог гапа в буфере
          maxLiveSyncPlaybackRate: 1.0,    // Нормальная скорость синхронизации
          liveDurationInfinity: true,      // Рассматриваем live как бесконечный
          // Таймауты загрузки - БОЛЕЕ АГРЕССИВНЫЕ
          fragLoadPolicy: {
            default: {
              maxTimeToFirstByteMs: 5000,   // 5 сек вместо 10
              maxLoadTimeMs: 15000          // 15 сек вместо 30
            }
          },
          // Более активный ABR для быстрого отклика
          abrEwmaSlowLive: 3000,            // Снизили для быстрого отклика
          abrEwmaFastLive: 1000,            // Быстрее реагируем на изменения
          abrBandwidthFactor: 0.9,          // Используем 90% доступной полосы
          abrBandwidthEstimate: 5000000     // Начальная оценка 5Mbps
        });

        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ Stream initialized');
          setError('');
          
          // Переходим на живой край потока
          const video = videoRef.current;
          if (video) {
            // Для live потока сразу переходим на конец буфера
            const jumpToLiveEdge = () => {
              const buffered = video.buffered;
              if (buffered.length > 0) {
                const liveEdge = buffered.end(buffered.length - 1);
                // Ставим текущее время на живой край (с небольшим буфером в 0.5 сек)
                const targetTime = Math.max(0, liveEdge - 0.5);
                if (Math.abs(video.currentTime - targetTime) > 1) {
                  video.currentTime = targetTime;
                  console.log(`🔴 Jumped to live edge: ${video.currentTime.toFixed(2)}s (buffer end: ${liveEdge.toFixed(2)}s)`);
                }
              } else {
                // Если буфер ещё не загружен, пробуем через 200ms
                setTimeout(jumpToLiveEdge, 200);
              }
            };
            
            jumpToLiveEdge();
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          // Игнорируем bufferStalledError - это нормально для live потоков
          if (data.details === 'bufferStalledError' && !data.fatal) {
            // Автоматически пропускаем, не логируем
            return;
          }
          
          console.error('HLS error:', data);
          
          // Обработка других non-fatal ошибок
          if (!data.fatal) {
            console.warn('Non-fatal HLS error, attempting recovery...');
            return;
          }

          // Fatal ошибки
          setError('⚠️ Ошибка потока');
          setIsPlaying(false);
          onError?.(data.message);
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        video.play().catch(err => {
          console.warn('Autoplay failed:', err);
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.play().catch(err => {
          console.warn('Autoplay failed:', err);
        });
      }
    } catch (err) {
      console.error('Player init error:', err);
      setError('❌ Ошибка инициализации плеера');
      onError?.(err.message);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isPlaying, streamKey, onError]);

  // Расчёт задержки потока (lag)
  useEffect(() => {
    if (!isPlaying || !videoRef.current) return;

    const updateLag = () => {
      const video = videoRef.current;
      if (video && hlsRef.current) {
        // Максимальный буфер минус текущий прогресс
        const buffered = video.buffered;
        if (buffered.length > 0) {
          const bufEnd = buffered.end(buffered.length - 1);
          const lag = bufEnd - video.currentTime;
          setBufferEnd(bufEnd);
          setCurrentTime(video.currentTime);
          setLagTime(Math.max(0, lag));
        }
      }
    };

    statsIntervalRef.current = setInterval(updateLag, 500);

    return () => {
      clearInterval(statsIntervalRef.current);
    };
  }, [isPlaying]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0);
      if (videoRef.current) videoRef.current.volume = 0;
    } else {
      setVolume(0.5);
      if (videoRef.current) videoRef.current.volume = 0.5;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (!isPaused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleProgressBarClick = (e) => {
    if (!progressBarRef.current || !videoRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    // Рассчитаем позицию для перемотки
    // Максимум - это конец буфера (живой край)
    const seekTime = percentage * bufferEnd;
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  if (!isPlaying) {
    return (
      <div className="live-stream-placeholder">
        <button
          className="live-stream-play-btn"
          onClick={() => setIsPlaying(true)}
        >
          {playIcon} Посмотреть трансляцию
        </button>
      </div>
    );
  }

  return (
    <div
      className={`live-stream-player ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {error && (
        <div className="stream-error-message">
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        className="live-stream-video"
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => setIsBuffering(false)}
      />

      {isBuffering && (
        <div className="stream-loading-overlay">
          <div className="stream-loading-spinner">
            <div className="spinner"></div>
            <p>Загрузка...</p>
          </div>
        </div>
      )}

      <div className={`live-stream-controls ${showControls ? 'visible' : 'hidden'}`}>
        {/* Прогрессбар (красный) - интерактивный */}
        <div 
          className="live-progress-bar"
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="live-progress-fill" 
            style={{ width: bufferEnd > 0 ? `${(currentTime / bufferEnd) * 100}%` : '0%' }}
          >
            <div className="live-progress-thumb"></div>
          </div>
        </div>

        {/* Нижние контролы */}
        <div className="live-controls-bottom">
          <div className="live-controls-left">
            <button
              className="live-control-btn"
              onClick={togglePlayPause}
              title={isPaused ? 'Воспроизвести' : 'Пауза'}
            >
              {isPaused ? playIcon : pauseIcon}
            </button>

            <div className="live-volume-control">
              <button
                className="live-control-btn"
                onClick={toggleMute}
                title={volume > 0 ? 'Выключить звук' : 'Включить звук'}
              >
                {volume > 0.5 ? volumeHighIcon : volume > 0 ? volumeLowIcon : volumeMuteIcon}
              </button>
              <input
                type="range"
                className="live-volume-slider"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>

            {/* Статус LIVE или задержка */}
            <div className="live-status">
              {lagTime > 1 ? (
                <span className="live-lag">
                  📡 {formatTime(currentTime)} / -{formatTime(lagTime)}
                </span>
              ) : (
                <>
                  <span className="live-pulse"></span>
                  <span className="live-text">LIVE</span>
                </>
              )}
            </div>
          </div>

          <div className="live-controls-right">
            <button
              className="live-control-btn"
              onClick={toggleFullscreen}
              title="На весь экран"
            >
              {fullscreenIcon}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPlayer;
