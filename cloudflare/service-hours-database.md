# Volunteer Hub Service Hours Database

Database: volunteer-db

## Tables

### service_hour_reports

Stores student service-hour submissions and approval decisions.

### service_hour_report_events

Stores the history of submissions, reviews, and status changes.

## Approval statuses

- Pending
- Approved
- Rejected
- Changes Requested

## Rules

1. Students submit claimed hours.
2. Reports start as Pending.
3. Students cannot approve their own reports.
4. Only authorized coordinators can approve reports.
5. Claimed and approved hours are stored separately.
6. Only approved reports count toward approved totals.
7. Approval activity must be recorded in the events table.

## Security

Database access must happen through authenticated server-side endpoints.

Do not trust student IDs, user roles, or approval statuses supplied by the browser.
