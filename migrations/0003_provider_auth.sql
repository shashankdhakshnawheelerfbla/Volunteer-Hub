-- Authentication profile metadata is kept separately to preserve the existing volunteers table.
CREATE TABLE IF NOT EXISTS auth_profiles (
    volunteer_id INTEGER PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'organizer')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);

-- One volunteer may connect multiple identity providers. Provider subjects are unique per provider.
CREATE TABLE IF NOT EXISTS provider_accounts (
    provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),
    provider_subject TEXT NOT NULL,
    volunteer_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (provider, provider_subject),
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_provider_accounts_volunteer ON provider_accounts(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);

-- Hashed IP/action keys are used for coarse rate limits. Raw IP addresses are not stored.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
    key_hash TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    window_started_at INTEGER NOT NULL,
    blocked_until INTEGER NOT NULL DEFAULT 0
);
