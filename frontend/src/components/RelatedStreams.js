import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RelatedStreams.css';

const RelatedStreams = ({ currentStreamKey }) => {
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreamKey]);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/streams?is_live=true&limit=6`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Фильтруем текущий стрим из списка
        const filtered = data.filter(s => s.channel?.stream_key !== currentStreamKey);
        setStreams(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch streams:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToStream = (streamKey) => {
    navigate(`/watch/${streamKey}`);
  };

  if (loading) {
    return (
      <div className="related-streams">
        <h3>Другие трансляции</h3>
        <div className="streams-loading">Загрузка...</div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="related-streams">
        <h3>Другие трансляции</h3>
        <div className="streams-empty">Нет других трансляций</div>
      </div>
    );
  }

  return (
    <div className="related-streams">
      <h3>Другие трансляции</h3>
      <div className="streams-grid">
        {streams.map(stream => (
          <div
            key={stream.id}
            className="stream-card"
            onClick={() => goToStream(stream.channel?.stream_key)}
          >
            <div className="stream-card-thumbnail">
              <img
                src={stream.thumbnail_url || '/default-stream.jpg'}
                alt={stream.title}
              />
              <div className="stream-card-badge">LIVE</div>
              {stream.duration > 0 && (
                <div className="stream-card-duration">
                  {Math.floor(stream.duration / 60)}:{(stream.duration % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
            <div className="stream-card-info">
              <h4>{stream.title}</h4>
              <p className="stream-card-channel">{stream.channel?.username || 'Неизвестный канал'}</p>
              <p className="stream-card-views">👁️ {stream.view_count || 0} просмотров</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedStreams;
