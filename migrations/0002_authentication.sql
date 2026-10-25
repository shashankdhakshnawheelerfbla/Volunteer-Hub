
-- Store password hashes for accounts created with email and password.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS password_credentials (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    volunteer_id INTEGER PRIMARY KEY,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    password_hash TEXT NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Declares a constraint or default for this database column or relationship.
    -- The rule helps keep stored data consistent.
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);

-- Link a volunteer profile to a verified Google account.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS google_accounts (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    google_sub TEXT PRIMARY KEY,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    volunteer_id INTEGER NOT NULL UNIQUE,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Declares a constraint or default for this database column or relationship.
    -- The rule helps keep stored data consistent.
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);

-- Store only a hash of each random session token, never the raw token.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS auth_sessions (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    token_hash TEXT PRIMARY KEY,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    volunteer_id INTEGER NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    expires_at TEXT NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Declares a constraint or default for this database column or relationship.
    -- The rule helps keep stored data consistent.
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);

-- Track repeated failed login attempts by normalized email address.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS login_attempts (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    email TEXT PRIMARY KEY,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    last_failed_at TEXT,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    locked_until TEXT
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);
