-- Инициализация базы данных XaTube
-- Создание пользователей таблицы
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы каналов
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    stream_key VARCHAR(255) UNIQUE NOT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    viewers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы видео/стримов
CREATE TABLE IF NOT EXISTS streams (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    duration INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    is_live BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы просмотров
CREATE TABLE IF NOT EXISTS stream_views (
    id SERIAL PRIMARY KEY,
    stream_id INTEGER NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    watch_duration INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Создание таблицы статистики
CREATE TABLE IF NOT EXISTS statistics (
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    avg_watch_time FLOAT DEFAULT 0,
    PRIMARY KEY (channel_id, date)
);

-- Создание таблицы документов (Terms, Privacy Policy и т.д.)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_is_live ON channels(is_live);
CREATE INDEX idx_streams_channel_id ON streams(channel_id);
CREATE INDEX idx_streams_is_live ON streams(is_live);
CREATE INDEX idx_stream_views_stream_id ON stream_views(stream_id);
CREATE INDEX idx_stream_views_user_id ON stream_views(user_id);
CREATE INDEX idx_statistics_channel_id ON statistics(channel_id);
CREATE INDEX idx_statistics_date ON statistics(date);
CREATE INDEX idx_documents_slug ON documents(slug);

-- Вставка нормативных документов
INSERT INTO documents (slug, title, content, version, is_active) VALUES
(
    'terms-of-service',
    'Условия использования',
    '<h1>Условия использования StreamHub</h1>
<p>Последнее обновление: 7 ноября 2025</p>
<h2>1. Принятие условий</h2>
<p>Используя StreamHub, вы принимаете эти условия использования и нашу политику конфиденциальности.</p>
<h2>2. Описание сервиса</h2>
<p>StreamHub - это платформа для прямого видеостриминга, позволяющая пользователям создавать, транслировать и смотреть видеоконтент в реальном времени.</p>
<h2>3. Учетные записи пользователей</h2>
<p>Вы отвечаете за сохранение конфиденциальности пароля и всех действиях, выполняемых под вашей учетной записью.</p>
<h2>4. Правила поведения</h2>
<p>Пользователи должны соблюдать все действующие законы и не публиковать незаконный, оскорбительный или вредоносный контент.</p>
<h2>5. Права на контент</h2>
<p>Вы сохраняете все права на контент, который загружаете. Вы даете StreamHub лицензию на использование этого контента для оказания сервисов.</p>
<h2>6. Ограничение ответственности</h2>
<p>StreamHub предоставляется "как есть" без каких-либо гарантий.</p>
<h2>7. Изменения в условиях</h2>
<p>Мы оставляем право изменять эти условия в любое время.</p>',
    1,
    TRUE
);

INSERT INTO documents (slug, title, content, version, is_active) VALUES
(
    'privacy-policy',
    'Политика конфиденциальности',
    '<h1>Политика конфиденциальности StreamHub</h1>
<p>Последнее обновление: 7 ноября 2025</p>
<h2>1. Сбор данных</h2>
<p>Мы собираем информацию, которую вы добровольно предоставляете при регистрации и использовании сервиса.</p>
<h2>2. Использование данных</h2>
<p>Ваши данные используются для предоставления и улучшения сервиса, а также для связи с вами.</p>
<h2>3. Безопасность</h2>
<p>Мы используем криптографические методы для защиты ваших данных.</p>
<h2>4. Cookies</h2>
<p>StreamHub использует cookies для сохранения сессии и предпочтений пользователя.</p>
<h2>5. Третьи стороны</h2>
<p>Мы не передаем ваши личные данные третьим лицам без вашего согласия.</p>
<h2>6. Ваши права</h2>
<p>Вы имеете право запросить доступ, исправление или удаление ваших личных данных.</p>
<h2>7. Контакты</h2>
<p>Если у вас есть вопросы о политике конфиденциальности, свяжитесь с нами.</p>',
    1,
    TRUE
);

INSERT INTO documents (slug, title, content, version, is_active) VALUES
(
    'content-guidelines',
    'Руководство по контенту',
    '<h1>Руководство по контенту StreamHub</h1>
<p>Последнее обновление: 7 ноября 2025</p>
<h2>1. Разрешенный контент</h2>
<p>StreamHub поддерживает широкий спектр контента, включая образовательный, развлекательный, творческий и профессиональный контент.</p>
<h2>2. Запрещенный контент</h2>
<ul>
<li>Насилие и оружие</li>
<li>Сексуальный контент и эксплуатация</li>
<li>Дискриминация и ненависть</li>
<li>Спам и мошенничество</li>
<li>Нарушение авторских прав</li>
<li>Вредоносное ПО</li>
</ul>
<h2>3. Возрастные ограничения</h2>
<p>Контент для взрослых должен быть помечен соответствующим образом.</p>
<h2>4. Авторские права</h2>
<p>Вы должны иметь право на весь контент, который вы загружаете, или получить лицензию на его использование.</p>
<h2>5. Нарушения</h2>
<p>Нарушения могут привести к ограничению, удалению контента или закрытию аккаунта.</p>
<h2>6. Жалобы</h2>
<p>Если вы видите нарушающий руководство контент, пожалуйста, сообщите об этом.</p>',
    1,
    TRUE
);

COMMIT;
