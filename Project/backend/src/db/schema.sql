-- ============================================================================
-- Placement Management System — PostgreSQL Schema
-- ============================================================================
-- This file is IDEMPOTENT: every run drops existing objects (CASCADE) and
-- recreates them from scratch inside a single transaction.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 0.  CLEAN SLATE  (reverse-dependency order)
-- ────────────────────────────────────────────────────────────────────────────

DROP TABLE  IF EXISTS application_status_audit CASCADE;
DROP TABLE  IF EXISTS applications              CASCADE;
DROP TABLE  IF EXISTS placement_drives          CASCADE;
DROP TABLE  IF EXISTS companies                 CASCADE;
DROP TABLE  IF EXISTS students                  CASCADE;
DROP TABLE  IF EXISTS users                     CASCADE;

DROP TYPE   IF EXISTS application_status        CASCADE;
DROP TYPE   IF EXISTS user_role                  CASCADE;

-- ────────────────────────────────────────────────────────────────────────────
-- 1.  ENUM TYPES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
    'STUDENT',
    'COMPANY',
    'TPO_ADMIN'
);

CREATE TYPE application_status AS ENUM (
    'APPLIED',
    'SHORTLISTED',
    'ROUND_1',
    'ROUND_2',
    'OFFERED',
    'REJECTED'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2.  TABLES
-- ────────────────────────────────────────────────────────────────────────────

-- 2-a  Users  ───────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            SERIAL        PRIMARY KEY,
    email         VARCHAR(255)  UNIQUE NOT NULL,
    password_hash TEXT          NOT NULL,
    role          user_role     NOT NULL,
    full_name     VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- 2-b  Students  ────────────────────────────────────────────────────────────
CREATE TABLE students (
    id              SERIAL        PRIMARY KEY,
    user_id         INT           UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department      VARCHAR(100)  NOT NULL,
    cgpa            NUMERIC(4,2)  CHECK (cgpa >= 0 AND cgpa <= 10),
    active_backlogs INT           DEFAULT 0 CHECK (active_backlogs >= 0),
    skills          TEXT[]        DEFAULT '{}',
    resume_url      TEXT,
    is_placed       BOOLEAN       DEFAULT FALSE,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- 2-c  Companies  ───────────────────────────────────────────────────────────
CREATE TABLE companies (
    id            SERIAL        PRIMARY KEY,
    user_id       INT           UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name  VARCHAR(255)  NOT NULL,
    industry      VARCHAR(100),
    website       TEXT,
    logo_url      TEXT,
    created_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- 2-d  Placement Drives  ───────────────────────────────────────────────────
CREATE TABLE placement_drives (
    id                   SERIAL        PRIMARY KEY,
    company_id           INT           NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title                VARCHAR(255)  NOT NULL,
    description          TEXT,
    ctc_lpa              NUMERIC(6,2)  NOT NULL,
    min_cgpa             NUMERIC(4,2)  DEFAULT 0.00,
    max_backlogs         INT           DEFAULT 0,
    allowed_departments  TEXT[]        NOT NULL,
    deadline             TIMESTAMPTZ   NOT NULL,
    drive_date           DATE,
    location             VARCHAR(255),
    is_active            BOOLEAN       DEFAULT TRUE,
    created_at           TIMESTAMPTZ   DEFAULT NOW()
);

-- 2-e  Applications  ───────────────────────────────────────────────────────
CREATE TABLE applications (
    id              SERIAL              PRIMARY KEY,
    student_id      INT                 NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    drive_id        INT                 NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    current_status  application_status  DEFAULT 'APPLIED',
    applied_at      TIMESTAMPTZ         DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         DEFAULT NOW(),

    -- A student can apply to a drive only once
    CONSTRAINT uq_student_drive UNIQUE (student_id, drive_id)
);

-- 2-f  Application Status Audit Log  ───────────────────────────────────────
CREATE TABLE application_status_audit (
    id              SERIAL              PRIMARY KEY,
    application_id  INT                 NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status application_status,
    new_status      application_status  NOT NULL,
    changed_at      TIMESTAMPTZ         DEFAULT NOW(),
    changed_by      TEXT
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3.  INDEXES
-- ────────────────────────────────────────────────────────────────────────────

-- B-tree indexes for foreign-key look-ups
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_drive_id   ON applications(drive_id);

-- GIN indexes for array containment / overlap queries
CREATE INDEX idx_students_skills                ON students       USING GIN (skills);
CREATE INDEX idx_placement_drives_allowed_depts ON placement_drives USING GIN (allowed_departments);

-- ────────────────────────────────────────────────────────────────────────────
-- 4.  PL/pgSQL TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────

-- 4-a  Eligibility gate  ───────────────────────────────────────────────────
--      Fires BEFORE INSERT on applications and validates the student
--      against the placement drive's eligibility criteria.

CREATE OR REPLACE FUNCTION check_eligibility_before_apply()
RETURNS TRIGGER AS $$
DECLARE
    v_cgpa            NUMERIC(4,2);
    v_backlogs        INT;
    v_department      VARCHAR(100);
    v_min_cgpa        NUMERIC(4,2);
    v_max_backlogs    INT;
    v_allowed_depts   TEXT[];
    v_deadline        TIMESTAMPTZ;
    v_is_active       BOOLEAN;
BEGIN
    -- Fetch student details
    SELECT cgpa, active_backlogs, department
      INTO v_cgpa, v_backlogs, v_department
      FROM students
     WHERE id = NEW.student_id;

    -- Fetch drive details
    SELECT min_cgpa, max_backlogs, allowed_departments, deadline, is_active
      INTO v_min_cgpa, v_max_backlogs, v_allowed_depts, v_deadline, v_is_active
      FROM placement_drives
     WHERE id = NEW.drive_id;

    -- Check 1: Drive must be active
    IF v_is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'This placement drive is no longer active.';
    END IF;

    -- Check 2: Deadline must not have passed
    IF NOW() > v_deadline THEN
        RAISE EXCEPTION 'The application deadline for this drive has passed (deadline: %).', v_deadline;
    END IF;

    -- Check 3: CGPA requirement
    IF v_cgpa < v_min_cgpa THEN
        RAISE EXCEPTION 'Student CGPA (%) does not meet the minimum requirement (%).', v_cgpa, v_min_cgpa;
    END IF;

    -- Check 4: Backlogs limit
    IF v_backlogs > v_max_backlogs THEN
        RAISE EXCEPTION 'Student has % active backlog(s); maximum allowed is %.', v_backlogs, v_max_backlogs;
    END IF;

    -- Check 5: Department must be in the allowed list
    IF NOT (v_department = ANY(v_allowed_depts)) THEN
        RAISE EXCEPTION 'Department "%" is not eligible for this drive. Allowed: %.', v_department, v_allowed_depts;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_eligibility
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION check_eligibility_before_apply();

-- 4-b  Status change audit logger  ─────────────────────────────────────────
--      Fires AFTER UPDATE OF current_status on applications and records
--      both old and new status values in the audit table.

CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
        INSERT INTO application_status_audit (application_id, previous_status, new_status, changed_by)
        VALUES (NEW.id, OLD.current_status, NEW.current_status, current_user);

        -- Also bump the updated_at timestamp on the application row
        NEW.updated_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_status_change
    AFTER UPDATE OF current_status ON applications
    FOR EACH ROW
    EXECUTE FUNCTION log_status_change();

-- ────────────────────────────────────────────────────────────────────────────
-- 5.  ANALYTICS VIEW — department_placement_stats
-- ────────────────────────────────────────────────────────────────────────────
--    Aggregates per-department: total students, placed count, placement %,
--    and average CTC for placed students (those with OFFERED applications).

CREATE OR REPLACE VIEW department_placement_stats AS
SELECT
    s.department,
    COUNT(DISTINCT s.id)                                          AS total_students,
    COUNT(DISTINCT s.id) FILTER (WHERE s.is_placed = TRUE)        AS placed_count,
    ROUND(
        COUNT(DISTINCT s.id) FILTER (WHERE s.is_placed = TRUE) * 100.0
        / NULLIF(COUNT(DISTINCT s.id), 0),
        2
    )                                                             AS placement_pct,
    ROUND(
        AVG(pd.ctc_lpa) FILTER (WHERE a.current_status = 'OFFERED'),
        2
    )                                                             AS avg_ctc_lpa
FROM students s
LEFT JOIN applications a
       ON a.student_id = s.id
LEFT JOIN placement_drives pd
       ON pd.id = a.drive_id
GROUP BY s.department
ORDER BY s.department;

-- ────────────────────────────────────────────────────────────────────────────
-- 6.  PREDEFINED PRIMARY ADMINISTRATOR
-- ────────────────────────────────────────────────────────────────────────────
-- Email: admin@gmail.com
-- Password: admin (bcryptjs hash for "admin")

INSERT INTO users (email, password_hash, role, full_name) VALUES
    ('admin@gmail.com', '$2a$10$NEFUgDMIO5XC9ysztiR5QOdoa0Vpwu6ycdN9tbvoBNZI9W5riIAPu', 'TPO_ADMIN', 'TPO Super Admin');

COMMIT;
