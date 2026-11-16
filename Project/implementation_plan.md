# Placement Management System — Implementation Plan & Architecture Specification

## 1. Project Overview & Objectives
A local, production-grade Placement Management System developed for the Advanced Database Management (ADMB) curriculum, highlighting advanced relational database design and PostgreSQL capabilities integrated with a modern React + Express stack.

---

## 2. PostgreSQL Database Architecture (`projdb`)

### 2.1 Custom ENUM Types
- `user_role`: `'STUDENT'`, `'COMPANY'`, `'TPO_ADMIN'`
- `application_status`: `'APPLIED'`, `'SHORTLISTED'`, `'ROUND_1'`, `'ROUND_2'`, `'OFFERED'`, `'REJECTED'`

### 2.2 Relational Model & Integrity Constraints
- `users`: Core authentication table with unique email, bcrypt hashed passwords, and roles.
- `students`: Linked 1:1 to `users`, enforcing `cgpa >= 0.00 AND cgpa <= 10.00`, `active_backlogs >= 0`, and `skills TEXT[]`.
- `companies`: Linked 1:1 to `users`, stores corporate metadata.
- `placement_drives`: Posted by companies, contains `ctc_lpa`, `min_cgpa`, `max_backlogs`, `allowed_departments TEXT[]`, `deadline`, and `is_active`.
- `applications`: Student-drive junction table with `uq_student_drive` UNIQUE constraint.
- `application_status_audit`: Immutable audit log capturing status transitions.

### 2.3 PL/pgSQL Triggers
1. **`trg_check_eligibility` (`BEFORE INSERT ON applications`)**:
   - Executes function `check_eligibility_before_apply()`.
   - Validates that:
     1. Drive `is_active = TRUE`
     2. Current time does not exceed `deadline`
     3. Student `cgpa >= min_cgpa`
     4. Student `active_backlogs <= max_backlogs`
     5. Student `department = ANY(allowed_departments)`
   - Raises informative `RAISE EXCEPTION` messages on any breach.
2. **`trg_log_status_change` (`AFTER UPDATE OF current_status ON applications`)**:
   - Executes function `log_status_change()`.
   - Populates `application_status_audit` with `previous_status`, `new_status`, timestamp, and actor.

### 2.4 Indexing Strategy
- **B-tree Indexes:** Foreign keys on `applications(student_id)` and `applications(drive_id)`.
- **GIN Indexes:** Inverted indexes on array attributes `students(skills)` and `placement_drives(allowed_departments)` for high-performance containment operations.

### 2.5 PostgreSQL View (`department_placement_stats`)
- Dynamic aggregation view calculating total students, placed count, placement percentage, and average CTC per department for students with `OFFERED` status.

---

## 3. Backend REST API Architecture (`backend/`)
- **Runtime:** Node.js v20+, Express.
- **Database Driver:** `pg` Pool configured via `.env` with fallback alerting if PostgreSQL service is stopped.
- **Authentication:** JWT tokens (24-hour expiry) stored on the client.
- **RBAC Middleware:** `authenticateToken` and `authorizeRole('STUDENT', 'COMPANY', 'TPO_ADMIN')`.
- **Routes:**
  - `/api/auth`: Registration, login, profile resolution (`/me`).
  - `/api/students`: Profile management, database-filtered eligible drives, submitted applications.
  - `/api/drives`: Drive listings, creation, updates, and applicant listings.
  - `/api/applications`: 1-click apply (catches trigger exceptions cleanly), status update pipeline.
  - `/api/analytics`: Queries `department_placement_stats` view, overview stats, and status audit log.

---

## 4. Frontend Client Architecture (`frontend/`)
- **Framework:** React 18+ bootstrapped with Vite.
- **Styling:** Tailwind CSS with custom palette and components.
- **Icons:** Lucide React.
- **Routing:** React Router v6 with `ProtectedRoute` component enforcing role-based dashboard redirects.
- **Dashboards:**
  - **Student:** Profile editor with constraint validation, eligible drives browser with trigger rejection alert banners, live application round timeline tracker.
  - **Company:** Drive management, drive creation form, candidate round progression manager.
  - **TPO Admin:** Institution overview metrics, real-time department stats table from PostgreSQL view, immutable audit trail viewer.

---

## 5. Verification & Delivery
- **Schema & Migration:** `backend/src/db/migrate.js` applies `schema.sql` cleanly with idempotent drops and verified row counts.
- **Full Verification Suite:** 13/13 automated integration tests verified 100% pass rate.
- **Root Orchestration:** `npm run dev` boots both backend (5000) and frontend (5173) concurrently.
