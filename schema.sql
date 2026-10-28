-- Volunteer Hub initial database schema.
-- Google accounts are intentionally excluded.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL UNIQUE,
    bio TEXT,
    phone TEXT,
    location TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    organization TEXT,
    location TEXT,
    start_date TEXT,
    end_date TEXT,
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES volunteers(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS volunteer_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    signed_up_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
        ON DELETE CASCADE,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
        ON DELETE CASCADE,
    UNIQUE (volunteer_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS password_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    volunteer_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
        ON DELETE CASCADE
);

-- Legacy session table retained for compatibility.
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    volunteer_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL COLLATE NOCASE,
    attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    successful INTEGER NOT NULL DEFAULT 0
        CHECK (successful IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_profiles_volunteer_id
    ON profiles(volunteer_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_status
    ON opportunities(status);

CREATE INDEX IF NOT EXISTS idx_opportunities_start_date
    ON opportunities(start_date);

CREATE INDEX IF NOT EXISTS idx_volunteer_signups_volunteer_id
    ON volunteer_signups(volunteer_id);

CREATE INDEX IF NOT EXISTS idx_volunteer_signups_opportunity_id
    ON volunteer_signups(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_volunteer_id
    ON auth_sessions(volunteer_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
    ON auth_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_volunteer_id
    ON sessions(volunteer_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
    ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
    ON login_attempts(email, attempted_at);