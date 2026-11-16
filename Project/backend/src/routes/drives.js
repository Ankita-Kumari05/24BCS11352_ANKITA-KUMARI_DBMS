const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/drives/company/my-drives   (COMPANY only)
// ---------------------------------------------------------------------------
router.get(
  '/company/my-drives',
  authenticateToken,
  authorizeRole('COMPANY'),
  async (req, res) => {
    try {
      const companyResult = await query(
        'SELECT id FROM companies WHERE user_id = $1',
        [req.user.id]
      );

      if (companyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Company profile not found.' });
      }

      const companyId = companyResult.rows[0].id;

      const result = await query(
        `SELECT d.*,
                (SELECT COUNT(*)::int FROM applications a WHERE a.drive_id = d.id) AS applicant_count
         FROM placement_drives d
         WHERE d.company_id = $1
         ORDER BY d.created_at DESC`,
        [companyId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error('Get my drives error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/drives          (authenticated, public listing)
// ---------------------------------------------------------------------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, c.company_name, c.industry, c.website, c.logo_url,
              (SELECT COUNT(*)::int FROM applications a WHERE a.drive_id = d.id) AS applicant_count
       FROM placement_drives d
       JOIN companies c ON c.id = d.company_id
       WHERE d.is_active = true
       ORDER BY d.deadline ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List drives error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/drives/:id      (authenticated)
// ---------------------------------------------------------------------------
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT d.*, c.company_name, c.industry, c.website, c.logo_url,
              (SELECT COUNT(*)::int FROM applications a WHERE a.drive_id = d.id) AS applicant_count
       FROM placement_drives d
       JOIN companies c ON c.id = d.company_id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Placement drive not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get drive error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/drives         (COMPANY only)
// ---------------------------------------------------------------------------
router.post(
  '/',
  authenticateToken,
  authorizeRole('COMPANY'),
  async (req, res) => {
    try {
      const {
        title,
        description,
        ctc_lpa,
        min_cgpa,
        max_backlogs,
        allowed_departments,
        deadline,
        drive_date,
        location,
      } = req.body;

      if (!title || ctc_lpa == null || !deadline || !allowed_departments) {
        return res.status(400).json({
          error: 'Title, CTC (LPA), deadline, and allowed departments are required.',
        });
      }

      // Get the company linked to this user
      const companyResult = await query(
        'SELECT id FROM companies WHERE user_id = $1',
        [req.user.id]
      );

      if (companyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Company profile not found.' });
      }

      const companyId = companyResult.rows[0].id;
      const deptArray = Array.isArray(allowed_departments)
        ? allowed_departments
        : typeof allowed_departments === 'string'
        ? allowed_departments.split(',').map((d) => d.trim()).filter(Boolean)
        : ['CSE'];

      const result = await query(
        `INSERT INTO placement_drives
           (company_id, title, description, ctc_lpa, min_cgpa, max_backlogs,
            allowed_departments, deadline, drive_date, location, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         RETURNING *`,
        [
          companyId,
          title,
          description || null,
          parseFloat(ctc_lpa),
          min_cgpa != null ? parseFloat(min_cgpa) : 0.0,
          max_backlogs != null ? parseInt(max_backlogs, 10) : 0,
          deptArray,
          deadline,
          drive_date || null,
          location || 'On-Campus',
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Create drive error:', err);
      res.status(500).json({ error: err.message || 'Internal server error.' });
    }
  }
);

// ---------------------------------------------------------------------------
// PUT /api/drives/:id      (COMPANY only – own drives)
// ---------------------------------------------------------------------------
router.put(
  '/:id',
  authenticateToken,
  authorizeRole('COMPANY'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify ownership
      const companyResult = await query(
        'SELECT id FROM companies WHERE user_id = $1',
        [req.user.id]
      );

      if (companyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Company profile not found.' });
      }

      const companyId = companyResult.rows[0].id;

      const driveCheck = await query(
        'SELECT id FROM placement_drives WHERE id = $1 AND company_id = $2',
        [id, companyId]
      );

      if (driveCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Drive not found or you do not own this drive.' });
      }

      const {
        title,
        description,
        ctc_lpa,
        min_cgpa,
        max_backlogs,
        allowed_departments,
        deadline,
        drive_date,
        location,
        is_active,
      } = req.body;

      const deptArray = allowed_departments
        ? Array.isArray(allowed_departments)
          ? allowed_departments
          : allowed_departments.split(',').map((d) => d.trim()).filter(Boolean)
        : null;

      const result = await query(
        `UPDATE placement_drives
         SET title               = COALESCE($1, title),
             description         = COALESCE($2, description),
             ctc_lpa             = COALESCE($3, ctc_lpa),
             min_cgpa            = COALESCE($4, min_cgpa),
             max_backlogs        = COALESCE($5, max_backlogs),
             allowed_departments = COALESCE($6, allowed_departments),
             deadline            = COALESCE($7, deadline),
             drive_date          = COALESCE($8, drive_date),
             location            = COALESCE($9, location),
             is_active           = COALESCE($10, is_active)
         WHERE id = $11
         RETURNING *`,
        [
          title || null,
          description || null,
          ctc_lpa != null ? parseFloat(ctc_lpa) : null,
          min_cgpa != null ? parseFloat(min_cgpa) : null,
          max_backlogs != null ? parseInt(max_backlogs, 10) : null,
          deptArray,
          deadline || null,
          drive_date || null,
          location || null,
          is_active != null ? is_active : null,
          id,
        ]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Update drive error:', err);
      res.status(500).json({ error: err.message || 'Internal server error.' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/drives/:id/applicants   (COMPANY or TPO_ADMIN)
// ---------------------------------------------------------------------------
router.get(
  '/:id/applicants',
  authenticateToken,
  authorizeRole('COMPANY', 'TPO_ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify the drive exists
      const driveCheck = await query(
        'SELECT id, company_id, title FROM placement_drives WHERE id = $1',
        [id]
      );
      if (driveCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Drive not found.' });
      }

      // If COMPANY role, verify they own the drive
      if (req.user.role === 'COMPANY') {
        const companyResult = await query(
          'SELECT id FROM companies WHERE user_id = $1',
          [req.user.id]
        );
        if (
          companyResult.rows.length === 0 ||
          companyResult.rows[0].id !== driveCheck.rows[0].company_id
        ) {
          return res
            .status(403)
            .json({ error: 'You can only view applicants for your own drives.' });
        }
      }

      const result = await query(
        `SELECT a.id AS application_id, a.id, a.current_status, a.current_status AS status, a.applied_at, a.updated_at,
                s.id AS student_id, s.department, s.cgpa, s.skills,
                s.active_backlogs, s.resume_url, s.is_placed,
                u.full_name, u.email
         FROM applications a
         JOIN students s ON s.id = a.student_id
         JOIN users u ON u.id = s.user_id
         WHERE a.drive_id = $1
         ORDER BY a.applied_at DESC`,
        [id]
      );

      res.json(result.rows);
    } catch (err) {
      console.error('Get applicants error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
