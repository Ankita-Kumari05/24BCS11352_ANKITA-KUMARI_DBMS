const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/applications        (STUDENT only)
// ---------------------------------------------------------------------------
router.post(
  '/',
  authenticateToken,
  authorizeRole('STUDENT'),
  async (req, res) => {
    try {
      const { drive_id } = req.body;

      if (!drive_id) {
        return res.status(400).json({ error: 'drive_id is required.' });
      }

      // Get student_id from auth user
      const studentResult = await query(
        'SELECT id FROM students WHERE user_id = $1',
        [req.user.id]
      );

      if (studentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Student profile not found.' });
      }

      const studentId = studentResult.rows[0].id;

      // Verify drive exists
      const driveCheck = await query(
        'SELECT id FROM placement_drives WHERE id = $1',
        [drive_id]
      );
      if (driveCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Placement drive not found.' });
      }

      // This INSERT will fire the PL/pgSQL Trigger: check_eligibility_before_apply()
      const result = await query(
        `INSERT INTO applications (student_id, drive_id, current_status)
         VALUES ($1, $2, 'APPLIED')
         RETURNING *`,
        [studentId, drive_id]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Application submission error:', err.message);

      // Unique constraint violation (duplicate application)
      if (err.code === '23505') {
        return res
          .status(400)
          .json({ error: 'You have already applied to this placement drive.' });
      }

      // PL/pgSQL Trigger RAISE EXCEPTION error code P0001
      if (err.code === 'P0001' || (err.message && !err.message.includes('syntax'))) {
        return res.status(400).json({ error: err.message });
      }

      res.status(500).json({ error: 'Internal server error while submitting application.' });
    }
  }
);

// ---------------------------------------------------------------------------
// PUT /api/applications/:id/status   (COMPANY or TPO_ADMIN)
// ---------------------------------------------------------------------------
router.put(
  '/:id/status',
  authenticateToken,
  authorizeRole('COMPANY', 'TPO_ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        'APPLIED',
        'SHORTLISTED',
        'ROUND_1',
        'ROUND_2',
        'OFFERED',
        'REJECTED',
      ];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }

      // Verify application exists
      const appCheck = await query(
        'SELECT id, student_id FROM applications WHERE id = $1',
        [id]
      );
      if (appCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Application not found.' });
      }

      // Updating current_status fires the PL/pgSQL Audit Trigger: log_status_change()
      const result = await query(
        `UPDATE applications
         SET current_status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );

      // If status is OFFERED, mark student as is_placed = true
      if (status === 'OFFERED') {
        await query(
          'UPDATE students SET is_placed = true, updated_at = NOW() WHERE id = $1',
          [appCheck.rows[0].student_id]
        );
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Update application status error:', err);
      res.status(500).json({ error: err.message || 'Internal server error.' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/applications/drive/:driveId   (COMPANY or TPO_ADMIN)
// ---------------------------------------------------------------------------
router.get(
  '/drive/:driveId',
  authenticateToken,
  authorizeRole('COMPANY', 'TPO_ADMIN'),
  async (req, res) => {
    try {
      const { driveId } = req.params;

      const result = await query(
        `SELECT a.id AS application_id, a.id, a.current_status, a.current_status AS status,
                a.applied_at, a.updated_at,
                s.id AS student_id, s.department, s.cgpa, s.skills,
                s.active_backlogs, s.resume_url, s.is_placed,
                u.full_name, u.email
         FROM applications a
         JOIN students s ON s.id = a.student_id
         JOIN users u ON u.id = s.user_id
         WHERE a.drive_id = $1
         ORDER BY a.applied_at DESC`,
        [driveId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error('Get drive applications error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
