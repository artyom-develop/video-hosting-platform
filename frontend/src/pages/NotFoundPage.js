import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">404</div>
        <h1 className="not-found-title">Страница не найдена</h1>
        <p className="not-found-description">
          Извините, страница, которую вы ищете, не существует или была удалена.
        </p>
        
        <div className="not-found-actions">
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            На главную
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Вернуться назад
          </button>
        </div>

        <div className="not-found-suggestions">
          <h2>Может быть, вы ищете:</h2>
          <ul>
            <li><a href="/">Главная страница</a></li>
            <li><a href="/login">Вход</a></li>
            <li><a href="/register">Регистрация</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
