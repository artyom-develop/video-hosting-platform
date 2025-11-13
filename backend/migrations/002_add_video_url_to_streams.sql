-- Add video_url column to streams table
ALTER TABLE streams ADD COLUMN video_url VARCHAR(500);

-- Create index for archived videos
CREATE INDEX idx_streams_archived ON streams(is_archived) WHERE is_archived = true;
