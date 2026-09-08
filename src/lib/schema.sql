CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL DEFAULT 'default_user',
  ticker VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_ticker UNIQUE(user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
