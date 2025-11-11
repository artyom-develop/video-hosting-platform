import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/StreamChat.css';

const StreamChat = ({ streamKey }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Подключение к WebSocket
  useEffect(() => {
    if (!streamKey) return;

    const connectWebSocket = () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
        const wsUrl = apiUrl.replace('http', 'ws') + `/streams/${streamKey}/chat`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ Chat connected');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Message received:', data);
            
            if (data.type === 'message') {
              setMessages(prev => [...prev, {
                id: Date.now(),
                username: data.username,
                avatar: data.avatar,
                text: data.text,
                timestamp: new Date(data.timestamp)
              }]);
            }
          } catch (err) {
            console.error('Failed to parse message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('❌ Chat disconnected');
          setIsConnected(false);
          // Пытаемся переподключиться через 3 сек
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error('WebSocket connection error:', err);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [streamKey]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !wsRef.current || !isConnected) {
      return;
    }

    const message = {
      type: 'message',
      text: inputValue.trim(),
      username: user?.username,
      avatar: user?.avatar_url
    };

    try {
      wsRef.current.send(JSON.stringify(message));
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="stream-chat">
      <div className="chat-header">
        <h3>Комментарии</h3>
        <div className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Онлайн' : 'Отключено'}
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Комментарии появятся здесь</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="chat-message">
              <div className="message-avatar">
                {msg.avatar ? (
                  <img src={msg.avatar} alt={msg.username} />
                ) : (
                  <div className="avatar-placeholder">{msg.username?.[0]?.toUpperCase()}</div>
                )}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-username">{msg.username}</span>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="message-text">{msg.text}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder={isConnected ? 'Напишите комментарий...' : 'Подключение...'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!isConnected}
          maxLength={500}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!isConnected || !inputValue.trim()}
          title="Отправить (Enter)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16865909 C3.34915502,0.9115617 2.40734225,1.0216827 1.77946707,1.4929748 C0.994623095,2.1272231 0.837654326,3.21679657 1.15159189,3.99999262 L3.03521743,10.4409802 C3.03521743,10.5980776 3.19218622,10.755175 3.50612381,10.755175 L16.6915026,11.5406619 C16.6915026,11.5406619 17.1624089,11.5406619 17.1624089,12.0119539 C17.1624089,12.4832459 16.6915026,12.4744748 16.6915026,12.4744748 Z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default StreamChat;
