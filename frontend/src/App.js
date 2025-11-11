import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import HomePage from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { StatisticsPage } from './pages/StatisticsPage';
import PlayerPage from './pages/PlayerPage';
import WatchStreamPage from './pages/WatchStreamPage';
import TestStreamPage from './pages/TestStreamPage';
import './styles/index.css';
import './styles/App.css';
import './styles/Header.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Загрузка...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(() => {
    const path = location.pathname;
    if (path.startsWith('/player')) return 'player';
    if (path === '/statistics') return 'statistics';
    if (path === '/profile') return 'profile';
    return 'home';
  });

  // Не показываем header на страницах логина/регистрации
  const showHeader = !['/login', '/register'].includes(location.pathname);

  return (
    <div className="app-container">
      {showHeader && <Header currentPage={currentPage} onPageChange={setCurrentPage} />}
      <div className="app-main">{children}</div>
    </div>
  );
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Загрузка...</div>;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <StatisticsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/player/:streamId" element={<PlayerPage />} />
        <Route path="/watch/:streamKey" element={<WatchStreamPage />} />
        <Route path="/test-stream" element={<TestStreamPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppLayout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
