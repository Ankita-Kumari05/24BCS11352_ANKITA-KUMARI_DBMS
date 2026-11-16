const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication + STUDENT role
router.use(authenticateToken, authorizeRole('STUDENT'));

// ---------------------------------------------------------------------------
// GET /api/students/profile
// ---------------------------------------------------------------------------
router.get('/profile', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id AS user_id, u.email, u.full_name, u.role, u.created_at,
              s.id AS student_id, s.department, s.cgpa, s.skills,
              s.active_backlogs, s.resume_url, s.is_placed
       FROM users u
       JOIN students s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get student profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/students/profile
// ---------------------------------------------------------------------------
router.put('/profile', async (req, res) => {
  try {
    const { cgpa, skills, active_backlogs, department, resume_url } = req.body;

    const skillsArray = skills
      ? Array.isArray(skills)
        ? skills
        : skills.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

    const result = await query(
      `UPDATE students
       SET cgpa            = COALESCE($1, cgpa),
           skills          = COALESCE($2, skills),
           active_backlogs = COALESCE($3, active_backlogs),
           department      = COALESCE($4, department),
           resume_url      = COALESCE($5, resume_url),
           updated_at      = NOW()
       WHERE user_id = $6
       RETURNING *`,
      [
        cgpa != null ? parseFloat(cgpa) : null,
        skillsArray,
        active_backlogs != null ? parseInt(active_backlogs, 10) : null,
        department || null,
        resume_url || null,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update student profile error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/students/eligible-drives
// ---------------------------------------------------------------------------
router.get('/eligible-drives', async (req, res) => {
  try {
    // Get student details
    const studentResult = await query(
      'SELECT id, department, cgpa, active_backlogs FROM students WHERE user_id = $1',
      [req.user.id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const student = studentResult.rows[0];

    // Filter drives where student qualifies
    const drivesResult = await query(
      `SELECT d.*, c.company_name, c.industry, c.website, c.logo_url,
              (SELECT a.current_status FROM applications a WHERE a.drive_id = d.id AND a.student_id = $1) AS user_application_status,
              EXISTS (SELECT 1 FROM applications a WHERE a.drive_id = d.id AND a.student_id = $1) AS has_applied
       FROM placement_drives d
       JOIN companies c ON c.id = d.company_id
       WHERE d.is_active = true
         AND d.deadline >= NOW()
         AND ($2::numeric >= d.min_cgpa)
         AND ($3::integer <= d.max_backlogs)
         AND ($4::varchar = ANY(d.allowed_departments))
       ORDER BY d.deadline ASC`,
      [student.id, student.cgpa, student.active_backlogs, student.department]
    );

    res.json(drivesResult.rows);
  } catch (err) {
    console.error('Get eligible drives error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/students/my-applications
// ---------------------------------------------------------------------------
router.get('/my-applications', async (req, res) => {
  try {
    const result = await query(
      `SELECT a.id AS application_id, a.id, a.current_status, a.current_status AS status,
              a.applied_at, a.updated_at,
              d.id AS drive_id, d.title, d.description, d.ctc_lpa, d.deadline, d.drive_date, d.location,
              c.company_name, c.industry, c.website
       FROM applications a
       JOIN students s ON s.id = a.student_id
       JOIN placement_drives d ON d.id = a.drive_id
       JOIN companies c ON c.id = d.company_id
       WHERE s.user_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get my applications error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
