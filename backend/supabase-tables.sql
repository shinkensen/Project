-- SQL schema for note_summaries and user_ai_limits tables
-- Run this in your Supabase SQL editor

-- Table for storing PDF summaries
CREATE TABLE IF NOT EXISTS note_summaries (
    pdf_url TEXT PRIMARY KEY,
    summary TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient user-based queries
CREATE INDEX IF NOT EXISTS idx_note_summaries_user_id ON note_summaries(user_id);

-- Table for tracking user AI usage limits
CREATE TABLE IF NOT EXISTS user_ai_limits (
    user_id TEXT PRIMARY KEY,
    daily_prompt_count INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    total_tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_note_summaries_updated_at
    BEFORE UPDATE ON note_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ai_limits_updated_at
    BEFORE UPDATE ON user_ai_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
