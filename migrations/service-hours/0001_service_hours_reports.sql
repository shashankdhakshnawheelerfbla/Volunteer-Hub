-- Volunteer Hub
-- Migration 0004: Service Hours Reports

CREATE TABLE IF NOT EXISTS service_hour_reports (
    id TEXT PRIMARY KEY,

    student_user_id TEXT NOT NULL,
    student_first_name TEXT NOT NULL,
    student_last_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_id TEXT NOT NULL,

    sponsor_first_name TEXT NOT NULL,
    sponsor_last_name TEXT NOT NULL,
    sponsor_email TEXT NOT NULL,

    service_date TEXT NOT NULL,
    activity_description TEXT NOT NULL,

    claimed_hours REAL NOT NULL
        CHECK (
            claimed_hours > 0
            AND claimed_hours <= 24
            AND ABS(claimed_hours * 4 -
                ROUND(claimed_hours * 4)) < 0.000001
        ),

    approved_hours REAL
        CHECK (
            approved_hours IS NULL
            OR (
                approved_hours >= 0
                AND approved_hours <= 24
                AND ABS(approved_hours * 4 -
                    ROUND(approved_hours * 4)) < 0.000001
            )
        ),

    approval_status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (
            approval_status IN (
                'Pending',
                'Approved',
                'Rejected',
                'Changes Requested'
            )
        ),

    approval_date TEXT,
    coordinator_signature TEXT,
    reviewed_by_user_id TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (
        (
            approval_status = 'Approved'
            AND approved_hours IS NOT NULL
            AND approval_date IS NOT NULL
            AND coordinator_signature IS NOT NULL
            AND reviewed_by_user_id IS NOT NULL
        )
        OR
        (
            approval_status != 'Approved'
            AND approved_hours IS NULL
        )
    )
);

CREATE TABLE IF NOT EXISTS service_hour_report_events (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (report_id)
        REFERENCES service_hour_reports(id)
);

CREATE INDEX IF NOT EXISTS idx_service_reports_student
ON service_hour_reports(student_user_id);

CREATE INDEX IF NOT EXISTS idx_service_reports_status
ON service_hour_reports(approval_status);

CREATE INDEX IF NOT EXISTS idx_service_reports_date
ON service_hour_reports(service_date);

CREATE INDEX IF NOT EXISTS idx_service_report_events
ON service_hour_report_events(report_id);
