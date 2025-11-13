import React, { useState, useRef, useEffect } from 'react';
import '../styles/VideoPlayer.css';

const VideoPlayer = ({ videoUrl, onTimeUpdate }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState('');
  const [isBuffering, setIsBuffering] = useState(false);

  // SVG иконки (одинаковые с LiveStreamPlayer)
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setError('');
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handlePlaying = () => setIsBuffering(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleError = () => {
      setError('Ошибка при загрузке видео');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('error', handleError);
    };
  }, [onTimeUpdate]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleProgressChange = (e) => {
    const time = (e.target.value / 100) * duration;
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={`video-player-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseMove={handleMouseMove}
    >
      <div className="video-player">
        <video
          ref={videoRef}
          src={videoUrl}
          crossOrigin="anonymous"
          className="video-element"
        />
        
        {error && (
          <div className="video-error-message">
            {error}
          </div>
        )}

        {isBuffering && (
          <div className="video-loading-overlay">
            <div className="video-loading-spinner">
              <div className="spinner"></div>
            </div>
          </div>
        )}

        <div className={`video-controls ${showControls ? 'visible' : ''}`}>
          <div className="progress-container">
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <input
              type="range"
              className="progress-slider"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
            />
          </div>

          <div className="controls-bottom">
            <div className="controls-left">
              <button className="control-btn play-btn" onClick={handlePlayPause}>
                {isPlaying ? pauseIcon : playIcon}
              </button>

              <div className="volume-control">
                <button className="volume-btn">
                  {volume === 0 ? volumeMuteIcon : volumeHighIcon}
                </button>
                <input
                  type="range"
                  className="volume-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                />
              </div>

              <div className="time-display">
                <span className="current-time">{formatTime(currentTime)}</span>
                <span className="separator"> / </span>
                <span className="duration">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="controls-right">
              <button className="control-btn fullscreen-btn" onClick={handleFullscreen}>
                {fullscreenIcon}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
