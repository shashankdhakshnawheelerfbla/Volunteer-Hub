-- Creates the table that stores volunteer account profiles.
-- Each volunteer receives a unique numeric identifier.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS volunteers (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    name TEXT NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    email TEXT NOT NULL UNIQUE,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);

-- Creates the table that stores volunteer opportunities.
-- Organizers can use these fields to describe events and their schedules.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS opportunities (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    title TEXT NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    description TEXT,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    location TEXT,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    event_date TEXT,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    start_time TEXT,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    end_time TEXT,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    capacity INTEGER,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);

-- Links volunteers to the opportunities they sign up for.
-- The foreign keys and unique constraint help prevent invalid or duplicate signups.
-- Defines a database table or index used to store or find records.
-- The schema establishes the structure the application expects.
CREATE TABLE IF NOT EXISTS volunteer_signups (
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    volunteer_id INTEGER NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    opportunity_id INTEGER NOT NULL,
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    status TEXT DEFAULT 'registered',
    -- Executes the statement or expression written on this line.
    -- It contributes to the behavior of this file at this point in the workflow.
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    -- Declares a constraint or default for this database column or relationship.
    -- The rule helps keep stored data consistent.
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
    -- Declares a constraint or default for this database column or relationship.
    -- The rule helps keep stored data consistent.
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    -- Declares a constraint or default for this database column or relationship.
    -- The rule helps keep stored data consistent.
    UNIQUE (volunteer_id, opportunity_id)
-- Executes the statement or expression written on this line.
-- It contributes to the behavior of this file at this point in the workflow.
);
