-- Preserve the existing legacy sessions table.
-- The newer authentication design uses auth_sessions.
-- This migration intentionally performs no schema changes.
SELECT 1;
