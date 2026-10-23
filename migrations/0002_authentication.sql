
-- Store password hashes for accounts created with email and password.
CREATE TABLE IF NOT EXISTS password_credentials (
    volunteer_id INTEGER PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
);

-- Link a volunteer profile to a verified Google account.
CREATE TABLE IF NOT EXISTS google_accounts (
    google_sub TEXT PRIMARY KEY,
    volunteer_id INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
);

-- Store only a hash of each random session token, never the raw token.
CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    volunteer_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
);

-- Track repeated failed login attempts by normalized email address.
CREATE TABLE IF NOT EXISTS login_attempts (
    email TEXT PRIMARY KEY,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_at TEXT,
    locked_until TEXT
);
