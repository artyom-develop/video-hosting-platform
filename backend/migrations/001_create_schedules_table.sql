-- Migration: Create schedules table
-- Description: Add table for storing stream schedules

CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_channel_id (channel_id),
    INDEX idx_scheduled_at (scheduled_at)
);

-- Create trigger to update updated_at
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON schedules
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP;
