import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';

export const Header = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = (page) => {
    onPageChange(page);
    navigate(`/${page === 'home' ? '' : page}`);
  };

  return (
    <div className="app-header-container">
      <div className="app-header">
        <div className="header-left">
          <h1 className="app-logo">XaTube</h1>
          <p className="app-tagline">Платформа видеотрансляции</p>
        </div>
        <div className="header-right">
          {user && (
            <div className="user-info">
              <span className="username">{user.username}</span>
            </div>
          )}
          {user && (
            <button className="logout-button" onClick={handleLogout}>
              Выход
            </button>
          )}
        </div>
      </div>

      {user && (
        <nav className="app-nav">
          <button
            className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            🏠 Главная
          </button>
          <button
            className={`nav-button ${currentPage === 'statistics' ? 'active' : ''}`}
            onClick={() => handleNavClick('statistics')}
          >
            📊 Статистика
          </button>
          <button
            className={`nav-button ${currentPage === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
          >
            👤 Профиль
          </button>
        </nav>
      )}
    </div>
  );
};

export default Header;
