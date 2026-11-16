const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, full_name, ...roleData } = req.body;

    // Basic validation
    if (!email || !password || !role || !full_name) {
      return res
        .status(400)
        .json({ error: 'Email, password, role, and full_name are required.' });
    }

    // Public registration only allows STUDENT and COMPANY
    if (role === 'TPO_ADMIN') {
      return res.status(403).json({
        error: 'Public registration for administrators is disabled. Only the primary administrator (admin@gmail.com) can create new administrators.',
      });
    }

    const validRoles = ['STUDENT', 'COMPANY'];
    if (!validRoles.includes(role)) {
      return res
        .status(400)
        .json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Check for existing user
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert into users
    const userResult = await query(
      `INSERT INTO users (email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, full_name`,
      [email, password_hash, role, full_name]
    );
    const user = userResult.rows[0];

    // Insert role-specific record
    if (role === 'STUDENT') {
      const { department, cgpa, skills, active_backlogs, resume_url } = roleData;
      const skillsArray = Array.isArray(skills)
        ? skills
        : typeof skills === 'string' && skills.trim()
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await query(
        `INSERT INTO students (user_id, department, cgpa, skills, active_backlogs, resume_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.id,
          department || 'CSE',
          cgpa != null && cgpa !== '' ? parseFloat(cgpa) : 0.0,
          skillsArray,
          active_backlogs != null && active_backlogs !== '' ? parseInt(active_backlogs, 10) : 0,
          resume_url || null,
        ]
      );
    } else if (role === 'COMPANY') {
      const { company_name, industry, website, logo_url } = roleData;
      await query(
        `INSERT INTO companies (user_id, company_name, industry, website, logo_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
          company_name || full_name,
          industry || null,
          website || null,
          logo_url || null,
        ]
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me   (authenticated)
// ---------------------------------------------------------------------------
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await query(
      'SELECT id, email, role, full_name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];
    let profile = { ...user };

    // Attach role-specific data
    if (user.role === 'STUDENT') {
      const studentResult = await query(
        'SELECT * FROM students WHERE user_id = $1',
        [user.id]
      );
      if (studentResult.rows.length > 0) {
        profile.student = studentResult.rows[0];
      }
    } else if (user.role === 'COMPANY') {
      const companyResult = await query(
        'SELECT * FROM companies WHERE user_id = $1',
        [user.id]
      );
      if (companyResult.rows.length > 0) {
        profile.company = companyResult.rows[0];
      }
    }

    res.json(profile);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/create-admin (Strictly: admin@gmail.com only)
// ---------------------------------------------------------------------------
router.post('/create-admin', authenticateToken, async (req, res) => {
  try {
    // Enforce that only the predefined primary administrator can create admins
    if (req.user.role !== 'TPO_ADMIN' || req.user.email !== 'admin@gmail.com') {
      return res.status(403).json({
        error: 'Unauthorized: Only the predefined administrator (admin@gmail.com) can create new administrators.',
      });
    }

    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO users (email, password_hash, role, full_name)
       VALUES ($1, $2, 'TPO_ADMIN', $3)
       RETURNING id, email, role, full_name, created_at`,
      [email, password_hash, full_name]
    );

    res.status(201).json({
      message: 'New administrator created successfully.',
      admin: result.rows[0],
    });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: err.message || 'Internal server error creating administrator.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/admins (Strictly: admin@gmail.com only)
// ---------------------------------------------------------------------------
router.get('/admins', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'TPO_ADMIN' || req.user.email !== 'admin@gmail.com') {
      return res.status(403).json({
        error: 'Unauthorized: Only the predefined administrator (admin@gmail.com) can manage administrators.',
      });
    }

    const result = await query(
      `SELECT id, email, full_name, role, created_at
       FROM users
       WHERE role = 'TPO_ADMIN'
       ORDER BY id ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get admins error:', err);
    res.status(500).json({ error: 'Internal server error fetching administrators.' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/auth/admins/:id (Strictly: admin@gmail.com only)
// ---------------------------------------------------------------------------
router.delete('/admins/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'TPO_ADMIN' || req.user.email !== 'admin@gmail.com') {
      return res.status(403).json({
        error: 'Unauthorized: Only the predefined administrator (admin@gmail.com) can remove administrators.',
      });
    }

    const { id } = req.params;

    const target = await query('SELECT email FROM users WHERE id = $1 AND role = $2', [id, 'TPO_ADMIN']);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Administrator not found.' });
    }

    if (target.rows[0].email === 'admin@gmail.com') {
      return res.status(400).json({
        error: 'The primary predefined administrator (admin@gmail.com) cannot be deleted.',
      });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Administrator deleted successfully.' });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.status(500).json({ error: 'Internal server error deleting administrator.' });
  }
});

module.exports = router;
