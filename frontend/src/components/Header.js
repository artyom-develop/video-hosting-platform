import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search?q=' + encodeURIComponent(searchQuery));
      setSearchQuery('');
    }
  };

  return (
    <header className='header'>
      <div className='header-container'>
        <div className='header-logo' onClick={() => navigate('/')}>
          <span className='logo-icon'></span>
          <span className='logo-text'>XaTube</span>
        </div>

        <form className='header-search' onSubmit={handleSearch}>
          <input
            type='text'
            placeholder='Поиск трансляций...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='search-input'
          />
          <button type='submit' className='search-button'></button>
        </form>

        <div className='header-menu'>
          {user ? (
            <>
              <button className='header-btn btn-white' onClick={() => navigate('/dashboard')}>
                 Начать трансляцию
              </button>
              <button className='header-btn btn-icon' title='Уведомления'>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>
              <ThemeToggle />
              <div className='profile-dropdown'>
                <button 
                  className='profile-btn'
                  onMouseEnter={() => setShowProfileMenu(true)}
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <div className='profile-avatar'>
                    {user?.avatar_url ? (
                      <img 
                        src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${user.avatar_url}`}
                        alt="Avatar"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = user.username ? user.username.charAt(0).toUpperCase() : 'U';
                        }}
                      />
                    ) : (
                      user.username ? user.username.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <span className='profile-name'>{user.full_name || user.username}</span>
                  <span className='dropdown-arrow'></span>
                </button>
                {showProfileMenu && (
                  <div 
                    className='dropdown-menu show'
                    onMouseEnter={() => setShowProfileMenu(true)}
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <Link to="/profile" onClick={() => setShowProfileMenu(false)} className='dropdown-item'>Профиль</Link>
                    <a href='#settings' className='dropdown-item'>Настройки</a>
                    <div className='dropdown-divider'></div>
                    <button onClick={() => { logout(); navigate('/'); setShowProfileMenu(false); }} className='dropdown-item logout-btn'>Выход</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <a href="/docs" className='header-link'>Документация</a>
              <a href="/api" className='header-link'>API</a>
              <a href="/support" className='header-link'>Поддержка</a>
              <ThemeToggle />
              <button className='header-btn btn-primary' onClick={() => navigate('/login')}>Войти</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
