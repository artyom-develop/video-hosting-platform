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
              <button className='header-btn btn-icon' title='Уведомления'></button>
              <ThemeToggle />
              <div className='profile-dropdown'>
                <button 
                  className='profile-btn'
                  onMouseEnter={() => setShowProfileMenu(true)}
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <div className='profile-avatar'>{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</div>
                  <span className='profile-name'>{user.username}</span>
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
