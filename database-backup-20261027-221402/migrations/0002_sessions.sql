-- Preserve the existing legacy sessions table.
-- The newer authentication design uses auth_sessions.
-- This migration intentionally performs no schema changes.
-- Runs a database statement to change or retrieve stored records.
-- The statement supports the application's data-storage workflow.
SELECT 1;
