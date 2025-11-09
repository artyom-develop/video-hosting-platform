import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

// Вспомогательная функция для обработки ошибок
const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (Array.isArray(detail)) {
      return detail
        .map((err) => (typeof err === 'object' && err.msg ? err.msg : JSON.stringify(err)))
        .join('; ');
    }
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return error.message || 'An error occurred';
};

// Stepper component для регистрации
export const RegisterPage = () => {
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = React.useState('email'); // 'email' | 'password' | 'details' | 'submit'
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [success, setSuccess] = React.useState('');

  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    passwordConfirm: '',
    username: '',
    fullName: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Очищаем ошибку для этого поля
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setCurrentStep('password');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.password.trim()) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    }
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Пароли не совпадают';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setCurrentStep('details');
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Имя пользователя должно содержать минимум 3 символа';
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Полное имя обязательно';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setCurrentStep('submit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      await register(formData.username, formData.email, formData.password, formData.fullName);
      setSuccess('Регистрация успешна! Перенаправление на страницу входа...');
      setTimeout(() => {
        window.location.href = '/login?registered=true';
      }, 1500);
    } catch (err) {
      setErrors({ submit: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'password') {
      setCurrentStep('email');
      setFormData(prev => ({ ...prev, password: '', passwordConfirm: '' }));
    } else if (currentStep === 'details') {
      setCurrentStep('password');
      setFormData(prev => ({ ...prev, username: '', fullName: '' }));
    } else if (currentStep === 'submit') {
      setCurrentStep('details');
    }
  };

  return (
    <div className="login-page">
      {/* Левая часть - Лого */}
      <div className="login-left">
        <div className="logo-section">
          <div className="logo-icon-large">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 7l-9 5-9-5V3l9 5 9-5v4z"/>
              <path d="M23 13l-9 5-9-5"/>
              <path d="M23 19l-9 5-9-5"/>
            </svg>
          </div>
          <h1 className="brand-name">XaTube</h1>
          <p className="brand-tagline">Присоединяйтесь к нашему стриминговому сообществу</p>
        </div>
      </div>

      {/* Правая часть - Форма регистрации */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <h2>Создать аккаунт</h2>
            <p>Присоединяйтесь к XaTube сегодня</p>
          </div>

          {errors.submit && (
            <div className="login-error">
              {errors.submit}
            </div>
          )}

          {success && (
            <div className="login-success">
              {success}
            </div>
          )}

          <form onSubmit={
            currentStep === 'email' ? handleEmailSubmit :
            currentStep === 'password' ? handlePasswordSubmit :
            currentStep === 'details' ? handleDetailsSubmit :
            handleSubmit
          } className="login-form">
            {/* Шаг 1: Email */}
            {currentStep === 'email' && (
              <div className="form-step active">
                <div className="form-field">
                  <label htmlFor="email">Адрес электронной почты</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className={errors.email ? 'error' : ''}
                    autoFocus
                  />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>

                <button type="submit" className="step-btn">
                  Продолжить
                </button>
              </div>
            )}

            {/* Шаг 2: Password */}
            {currentStep === 'password' && (
              <div className="form-step active">
                <div className="form-field">
                  <label htmlFor="password">Пароль</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Минимум 8 символов"
                    className={errors.password ? 'error' : ''}
                    autoFocus
                  />
                  {errors.password && <div className="field-error">{errors.password}</div>}
                </div>

                <div className="form-field">
                  <label htmlFor="passwordConfirm">Подтвердите пароль</label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleInputChange}
                    placeholder="Повторите пароль"
                    className={errors.passwordConfirm ? 'error' : ''}
                  />
                  {errors.passwordConfirm && <div className="field-error">{errors.passwordConfirm}</div>}
                </div>

                <div className="step-actions">
                  <button type="button" className="back-btn" onClick={handleBack}>
                    Назад
                  </button>
                  <button type="submit" className="step-btn">
                    Продолжить
                  </button>
                </div>
              </div>
            )}

            {/* Шаг 3: Details */}
            {currentStep === 'details' && (
              <div className="form-step active">
                <div className="form-field">
                  <label htmlFor="username">Имя пользователя</label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Выберите уникальное имя пользователя"
                    className={errors.username ? 'error' : ''}
                    autoFocus
                  />
                  {errors.username && <div className="field-error">{errors.username}</div>}
                </div>

                <div className="form-field">
                  <label htmlFor="fullName">Полное имя</label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Ваше полное имя"
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <div className="field-error">{errors.fullName}</div>}
                </div>

                <div className="step-actions">
                  <button type="button" className="back-btn" onClick={handleBack}>
                    Назад
                  </button>
                  <button type="submit" className="step-btn">
                    Зарегистрироваться
                  </button>
                </div>
              </div>
            )}

            {/* Шаг 4: Submit */}
            {currentStep === 'submit' && (
              <div className="form-step active">
                <div className="user-info">
                  <div className="user-avatar">
                    {formData.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <div className="username-display">{formData.username}</div>
                    <div className="login-text">Готовы создать аккаунт</div>
                  </div>
                </div>

                <div className="step-actions">
                  <button type="button" className="back-btn" onClick={handleBack}>
                    Назад
                  </button>
                  <button type="submit" className="login-btn-final" disabled={loading}>
                    {loading && <span className="btn-spinner"></span>}
                    {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="login-footer">
            <p>Уже есть аккаунт? <a href="/login">Войти</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Login Page
export const LoginPage = () => {
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = React.useState('username'); // 'username' | 'password' | 'submit'
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrors((prev) => ({ ...prev, username: 'Имя пользователя обязательно' }));
      return;
    }
    setErrors({});
    setCurrentStep('password');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrors((prev) => ({ ...prev, password: 'Пароль обязателен' }));
      return;
    }
    setErrors({});
    setCurrentStep('submit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setLoading(true);

    try {
      await login(username, password);
      window.location.href = '/';
    } catch (err) {
      setGeneralError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'password') {
      setCurrentStep('username');
      setPassword('');
      setErrors({});
    } else if (currentStep === 'submit') {
      setCurrentStep('password');
      setErrors({});
    }
  };

  return (
    <div className="login-page">
      {/* Левая часть - Лого */}
      <div className="login-left">
        <div className="logo-section">
          <div className="logo-icon-large">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 7l-9 5-9-5V3l9 5 9-5v4z"/>
              <path d="M23 13l-9 5-9-5"/>
              <path d="M23 19l-9 5-9-5"/>
            </svg>
          </div>
          <h1 className="brand-name">XaTube</h1>
          <p className="brand-tagline">Платформа стриминга для создателей</p>
        </div>
      </div>

      {/* Правая часть - Форма входа */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <h2>Добро пожаловать обратно</h2>
            <p>Войдите в свой аккаунт</p>
          </div>

          {generalError && (
            <div className="login-error">
              {generalError}
            </div>
          )}

          <form onSubmit={currentStep === 'username' ? handleUsernameSubmit : currentStep === 'password' ? handlePasswordSubmit : handleSubmit} className="login-form">
            {/* Шаг 1: Username */}
            {currentStep === 'username' && (
              <div className="form-step active">
                <div className="form-field">
                  <label htmlFor="username">Имя пользователя</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors((prev) => ({ ...prev, username: '' }));
                    }}
                    placeholder="Введите имя пользователя"
                    className={errors.username ? 'error' : ''}
                    autoComplete="username"
                    autoFocus
                  />
                  {errors.username && <div className="field-error">{errors.username}</div>}
                </div>

                <button type="submit" className="step-btn">
                  Продолжить
                </button>
              </div>
            )}

            {/* Шаг 2: Password */}
            {currentStep === 'password' && (
              <div className="form-step active">
                <div className="form-field">
                  <label htmlFor="password">Пароль</label>
                  <div className="password-input-container">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="Введите пароль"
                      className={errors.password ? 'error' : ''}
                      autoComplete="current-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <div className="field-error">{errors.password}</div>}
                </div>

                <div className="step-actions">
                  <button type="button" className="back-btn" onClick={handleBack}>
                    Назад
                  </button>
                  <button type="submit" className="step-btn">
                    Войти
                  </button>
                </div>
              </div>
            )}

            {/* Шаг 3: Submit */}
            {currentStep === 'submit' && (
              <div className="form-step active">
                <div className="user-info">
                  <div className="user-avatar">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <div className="username-display">{username}</div>
                    <div className="login-text">Нажмите для входа</div>
                  </div>
                </div>

                <div className="step-actions">
                  <button type="button" className="back-btn" onClick={handleBack}>
                    Назад
                  </button>
                  <button type="submit" className="login-btn-final" disabled={loading}>
                    {loading && <span className="btn-spinner"></span>}
                    {loading ? 'Вход...' : 'Войти'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="login-footer">
            <p>Нет аккаунта? <a href="/register">Создать</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};
