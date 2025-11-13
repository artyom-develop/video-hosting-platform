-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    stream_id INTEGER NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_comments_stream FOREIGN KEY(stream_id) REFERENCES streams(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indices for faster queries
CREATE INDEX idx_comments_stream_id ON comments(stream_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
