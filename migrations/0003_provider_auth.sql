-- Authentication profile metadata is kept separately to preserve the existing volunteers table.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS auth_profiles (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    volunteer_id INTEGER PRIMARY KEY,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'organizer')),
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Declares a constraint or default for this database column or relationship.
    -- The rule helps keep stored data consistent.
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);

-- One volunteer may connect multiple identity providers. Provider subjects are unique per provider.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS provider_accounts (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    provider_subject TEXT NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    volunteer_id INTEGER NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Declares a constraint or default for this database column or relationship.
    -- The rule helps keep stored data consistent.
    PRIMARY KEY (provider, provider_subject),
    -- Declares a constraint or default for this database column or relationship.
    -- The rule helps keep stored data consistent.
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE INDEX IF NOT EXISTS idx_provider_accounts_volunteer ON provider_accounts(volunteer_id);
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);

-- Hashed IP/action keys are used for coarse rate limits. Raw IP addresses are not stored.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    key_hash TEXT PRIMARY KEY,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    attempts INTEGER NOT NULL DEFAULT 0,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    window_started_at INTEGER NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    blocked_until INTEGER NOT NULL DEFAULT 0
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);
