import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/channels?is_live=true')
      .then(res => setStreams(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredStreams = streams.filter(stream =>
    stream.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0 }}>StreamHub</h1>
            <div>
              {user ? (
                <span>{user.username}</span>
              ) : (
                <a href="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderBottom: '1px solid #ddd'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search streams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Streams Grid */}
      <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
        {loading ? (
          <p>Loading streams...</p>
        ) : filteredStreams.length === 0 ? (
          <p>No live streams available</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {filteredStreams.map(stream => (
              <div key={stream.id} style={{
                background: 'white',
                borderRadius: '5px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              onClick={() => window.location.href = `/stream/${stream.id}`}
              >
                <div style={{
                  background: '#ddd',
                  height: '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {stream.thumbnail_url ? (
                    <img src={stream.thumbnail_url} alt={stream.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <span style={{ color: '#999' }}>No thumbnail</span>
                  )}
                </div>
                <div style={{ padding: '15px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{stream.title}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                    👥 {stream.viewers_count} watching
                  </p>
                  <div style={{
                    background: '#ff6b6b',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    display: 'inline-block'
                  }}>
                    LIVE
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
