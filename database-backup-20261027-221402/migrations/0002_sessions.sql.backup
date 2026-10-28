-- Creates a table for server-side login sessions.
-- Session tokens should be random, opaque values stored securely by the application.
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    volunteer_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
);

-- Adds an index to find sessions by the account that owns them.
-- This can make account-session lookups more efficient.
CREATE INDEX IF NOT EXISTS idx_sessions_volunteer_id
ON sessions(volunteer_id);

-- Adds an index to find sessions by expiration time.
-- Applications can use it when checking or cleaning up expired sessions.
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
ON sessions(expires_at);
