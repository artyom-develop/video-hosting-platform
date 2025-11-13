import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/VideoCard.css';

const VideoCard = ({ video, onEdit, onDelete, isEditable = false }) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(video);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      if (window.confirm('Вы уверены, что хотите удалить это видео?')) {
        onDelete(video.id);
      }
    }
  };

  const thumbnailUrl = video.thumbnail_url 
    ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${video.thumbnail_url}`
    : '/default-video.jpg';

  return (
    <Link to={`/watch/video/${video.id}`} className="video-card-link">
      <div className="video-card">
        <div className="video-thumbnail">
          <img 
            src={thumbnailUrl} 
            alt={video.title}
            onError={(e) => {
              e.target.src = '/default-video.jpg';
            }}
          />
          <div className="video-duration">{video.duration || '0:00'}</div>
          {isEditable && (
            <div className="video-actions-overlay">
              <button 
                className="btn-icon btn-edit"
                onClick={handleEdit}
                title="Редактировать"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button 
                className="btn-icon btn-delete"
                onClick={handleDelete}
                title="Удалить"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="video-info">
          <h3>{video.title}</h3>
          <p className="video-description">{video.description}</p>
          <div className="video-stats">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {video.view_count || 0}
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
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
