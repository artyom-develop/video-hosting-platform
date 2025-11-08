import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Statistics.css';

export const StatisticsPage = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [topStreams, setTopStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError('');

    try {
      // Получаем общую статистику канала
      const statsResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/statistics/channel/1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!statsResponse.ok) throw new Error('Ошибка при получении статистики');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Получаем дневную статистику
      const dailyResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/statistics/channel/1/daily?days=${selectedPeriod}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (dailyResponse.ok) {
        const dailyData = await dailyResponse.json();
        setDailyStats(dailyData);
      }

      // Получаем топ потоки
      const topResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/statistics/channel/1/top-streams?limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (topResponse.ok) {
        const topData = await topResponse.json();
        setTopStreams(topData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="stats-container">Загрузка статистики...</div>;
  }

  return (
    <div className="stats-container">
      <h1>Статистика вашего канала</h1>

      {error && <div className="error-message">{error}</div>}

      {stats && (
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-value">{stats.total_views.toLocaleString()}</div>
            <div className="stat-label">Всего просмотров</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{stats.unique_viewers.toLocaleString()}</div>
            <div className="stat-label">Уникальных зрителей</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">
              {Math.round(stats.avg_watch_time / 60)} мин
            </div>
            <div className="stat-label">Среднее время просмотра</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{stats.active_streams}</div>
            <div className="stat-label">Активных трансляций</div>
          </div>
        </div>
      )}

      <div className="stats-section">
        <div className="section-header">
          <h2>Активность за период</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
          >
            <option value={7}>За 7 дней</option>
            <option value={30}>За 30 дней</option>
            <option value={90}>За 90 дней</option>
          </select>
        </div>

        {dailyStats.length > 0 ? (
          <div className="daily-stats-table">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Просмотров</th>
                  <th>Уникальные зрители</th>
                  <th>Среднее время (мин)</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((stat) => (
                  <tr key={stat.date}>
                    <td>{new Date(stat.date).toLocaleDateString('ru-RU')}</td>
                    <td>{stat.total_views.toLocaleString()}</td>
                    <td>{stat.unique_viewers.toLocaleString()}</td>
                    <td>{Math.round(stat.avg_watch_time / 60)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">Нет данных за выбранный период</p>
        )}
      </div>

      {topStreams.length > 0 && (
        <div className="stats-section">
          <h2>Топ видео по просмотрам</h2>
          <div className="top-streams-list">
            {topStreams.map((stream, index) => (
              <div key={stream.id} className="top-stream-item">
                <div className="rank">{index + 1}</div>
                <div className="stream-info">
                  <h3>{stream.title}</h3>
                  <p className="description">{stream.description || 'Описание отсутствует'}</p>
                </div>
                <div className="view-count">
                  <div className="count">{stream.view_count.toLocaleString()}</div>
                  <div className="label">просмотров</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stats-info">
        <p>
          💡 Статистика обновляется в реальном времени. Просмотры и уникальные зрители
          записываются автоматически при каждой трансляции.
        </p>
      </div>
    </div>
  );
};
