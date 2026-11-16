const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All routes require TPO_ADMIN role
router.use(authenticateToken, authorizeRole('TPO_ADMIN'));

// ---------------------------------------------------------------------------
// GET /api/analytics/department-stats (PostgreSQL View)
// ---------------------------------------------------------------------------
router.get('/department-stats', async (req, res) => {
  try {
    const result = await query('SELECT * FROM department_placement_stats');
    res.json(result.rows);
  } catch (err) {
    console.error('Department stats error:', err);
    res.status(500).json({ error: 'Internal server error fetching department stats.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/analytics/audit-log (Application Status Audit)
// ---------------------------------------------------------------------------
router.get('/audit-log', async (req, res) => {
  try {
    const { application_id, limit } = req.query;
    const queryLimit = parseInt(limit, 10) || 50;

    let sql = `
      SELECT asa.*,
             a.student_id, a.drive_id, a.current_status,
             s.department, s.cgpa,
             u.full_name AS student_name,
             d.title AS drive_title, d.ctc_lpa,
             c.company_name
      FROM application_status_audit asa
      JOIN applications a ON a.id = asa.application_id
      JOIN students s ON s.id = a.student_id
      JOIN users u ON u.id = s.user_id
      JOIN placement_drives d ON d.id = a.drive_id
      JOIN companies c ON c.id = d.company_id
    `;

    const params = [];

    if (application_id) {
      params.push(application_id);
      sql += ` WHERE asa.application_id = $${params.length}`;
    }

    sql += ` ORDER BY asa.changed_at DESC`;

    params.push(queryLimit);
    sql += ` LIMIT $${params.length}`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ error: 'Internal server error fetching audit logs.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/analytics/overview
// ---------------------------------------------------------------------------
router.get('/overview', async (req, res) => {
  try {
    const [drives, applications, offers, students, placed, companies] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM placement_drives WHERE is_active = true'),
      query('SELECT COUNT(*)::int AS count FROM applications'),
      query("SELECT COUNT(*)::int AS count FROM applications WHERE current_status = 'OFFERED'"),
      query('SELECT COUNT(*)::int AS count FROM students'),
      query('SELECT COUNT(*)::int AS count FROM students WHERE is_placed = true'),
      query('SELECT COUNT(*)::int AS count FROM companies'),
    ]);

    const totalStudents = students.rows[0].count;
    const placedStudents = placed.rows[0].count;
    const placementRate = totalStudents > 0
      ? Math.round((placedStudents / totalStudents) * 100 * 10) / 10
      : 0;

    res.json({
      total_drives: drives.rows[0].count,
      total_applications: applications.rows[0].count,
      total_offers: offers.rows[0].count,
      total_students: totalStudents,
      placed_students: placedStudents,
      total_companies: companies.rows[0].count,
      placement_rate: placementRate,
    });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ error: 'Internal server error fetching overview metrics.' });
  }
});

module.exports = router;
