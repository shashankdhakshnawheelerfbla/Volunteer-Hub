-- Creates the table that stores volunteer account profiles.
-- Each volunteer receives a unique numeric identifier.
CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Creates the table that stores volunteer opportunities.
-- Organizers can use these fields to describe events and their schedules.
CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    event_date TEXT,
    start_time TEXT,
    end_time TEXT,
    capacity INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Links volunteers to the opportunities they sign up for.
-- The foreign keys and unique constraint help prevent invalid or duplicate signups.
CREATE TABLE IF NOT EXISTS volunteer_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    status TEXT DEFAULT 'registered',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    UNIQUE (volunteer_id, opportunity_id)
);
