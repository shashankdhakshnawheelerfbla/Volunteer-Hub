-- EXAMPLE DATA ONLY. Do not run against production.
-- Run only in a disposable LOCAL database after applying the main DB migrations.
INSERT INTO volunteers (name, email)
VALUES ('Jordan Sample', 'jordan.sample@example.test');

INSERT INTO profiles (volunteer_id, bio, phone, location)
SELECT id, 'Local test profile.', '555-0100', 'Smyrna, GA'
FROM volunteers
WHERE email = 'jordan.sample@example.test';

INSERT INTO opportunities (title, description, organization, location, status)
VALUES ('Community Cleanup - Test', 'Disposable local test opportunity.',
        'Sample Community Group', 'Smyrna, GA', 'open');

INSERT INTO volunteer_signups (volunteer_id, opportunity_id, status)
SELECT v.id, o.id, 'pending'
FROM volunteers v CROSS JOIN opportunities o
WHERE v.email = 'jordan.sample@example.test'
  AND o.title = 'Community Cleanup - Test';

-- Service-hours data belongs in the separate volunteer-hours-db only.
-- Apply its migration before using a service_hour_reports fixture.
