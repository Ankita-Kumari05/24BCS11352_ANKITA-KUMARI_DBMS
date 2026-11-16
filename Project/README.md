# Placement Management System (PlaceMe)

> Production-ready, full-stack campus recruitment platform built for **Advanced Database Management (ADMB)**.

---

## 🌟 Advanced PostgreSQL Architecture (ADMB Focus)

1. **Custom ENUM Types & Strong Typing:**
   - `user_role`: `'STUDENT'`, `'COMPANY'`, `'TPO_ADMIN'`
   - `application_status`: `'APPLIED'`, `'SHORTLISTED'`, `'ROUND_1'`, `'ROUND_2'`, `'OFFERED'`, `'REJECTED'`
2. **Domain Integrity & CHECK Constraints:**
   - `cgpa >= 0.00 AND cgpa <= 10.00`
   - `active_backlogs >= 0`
   - Unique constraint `(student_id, drive_id)` preventing duplicate application submissions
3. **PL/pgSQL Trigger #1 — Eligibility Guard (`trg_check_eligibility`):**
   - Fires `BEFORE INSERT ON applications`
   - Validates student CGPA against drive `min_cgpa`, student backlogs against `max_backlogs`, department containment in `allowed_departments` array (`s.department = ANY(d.allowed_departments)`), active status, and deadline.
   - Raises descriptive SQL exceptions (`RAISE EXCEPTION`) caught gracefully by the Express backend and surfaced in the UI.
4. **PL/pgSQL Trigger #2 — Automated Status Audit Trail (`trg_log_status_change`):**
   - Fires `AFTER UPDATE OF current_status ON applications`
   - Automatically logs state changes into an immutable `application_status_audit` table with timestamp, previous status, new status, and DB user actor.
5. **Dynamic Analytics View (`department_placement_stats`):**
   - Aggregates per-department: `total_students`, `placed_count`, `placement_pct`, and `avg_ctc_lpa` for students with `OFFERED` status.
6. **Indexing Strategy:**
   - **B-tree indexes:** `applications(student_id)`, `applications(drive_id)`
   - **GIN indexes:** `students(skills)` and `placement_drives(allowed_departments)` for high-performance array containment lookups.

---

## 🚀 Deployment & Quick Start

### 1. Database Initialization
Ensure PostgreSQL is running locally on port `5432` with database `projdb`. Then apply the clean production schema:
```bash
npm run migrate
```
This applies all tables, ENUMs, triggers, indexes, and views with clean production state.

### 2. Predefined Super Administrator
The database includes one predefined primary administrator with full privileges:
- **Email:** `admin@gmail.com`
- **Password:** `admin`
- **Privilege:** Only this predefined administrator (`admin@gmail.com`) can create and manage additional administrator accounts. Public sign-up for admins is strictly blocked.

### 3. Start the Platform
Run both backend and frontend concurrently:
```bash
npm run dev
```
- **Web App (Frontend):** [http://localhost:5173](http://localhost:5173)
- **REST API (Backend):** [http://localhost:5000](http://localhost:5000)

---

## 👥 User Roles & Workflow

1. **Students:**
   - Register account with department, CGPA, backlogs, and technical skills.
   - Browse eligible campus drives (filtered by the database against criteria).
   - Apply with 1-click (real-time validation by PostgreSQL Trigger #1).
   - Track application round progress in real-time.
2. **Companies / Recruiters:**
   - Register organization profile.
   - Post recruitment drives with CTC (LPA), minimum CGPA, maximum backlogs, eligible branches, and deadlines.
   - Evaluate candidate applications and advance recruitment rounds (`SHORTLISTED` → `ROUND_1` → `ROUND_2` → `OFFERED` / `REJECTED`).
   - Every status modification is recorded automatically by PostgreSQL Trigger #2.
3. **TPO Administrator:**
   - View aggregated metrics across the institution.
   - Query the `department_placement_stats` database view for branch-wise placement percentages and average packages.
   - Inspect the immutable `application_status_audit` trail.

---

## 🛠️ Tech Stack
- **Database:** PostgreSQL (with PL/pgSQL Triggers, GIN & B-tree indexes, Dynamic Views)
- **Backend:** Node.js, Express, `pg` (Connection Pool), JWT Auth, bcryptjs, CORS
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Axios
- **Orchestration:** Monorepo root `concurrently` runner (`npm run dev`)
