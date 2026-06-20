const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

// ─── Middleware: verify JWT ────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ─── Middleware: admin only ────────────────────────────────────
function adminOnly(req, res, next) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// GET /api/users — all users (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, employee_id, name, email, phone, role, status, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users — create user (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  const { employee_id, name, email, phone, password, role, status } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'name, email, password, role are required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (employee_id, name, email, phone, password, role, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, employee_id, name, email, phone, role, status, created_at`,
      [employee_id || null, name, email, phone || null, hashed, role, status || 'ACTIVE']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — update user (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { employee_id, name, email, phone, role, status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET employee_id=$1, name=$2, email=$3, phone=$4, role=$5, status=$6
       WHERE id=$7
       RETURNING id, employee_id, name, email, phone, role, status, created_at`,
      [employee_id || null, name, email, phone || null, role, status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/toggle-status — activate / deactivate
router.patch('/:id/toggle-status', auth, adminOnly, async (req, res) => {
  try {
    const { rows: cur } = await pool.query('SELECT status FROM users WHERE id=$1', [req.params.id]);
    if (!cur.length) return res.status(404).json({ error: 'User not found' });
    const newStatus = cur[0].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const { rows } = await pool.query(
      'UPDATE users SET status=$1 WHERE id=$2 RETURNING id, name, status',
      [newStatus, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/users/:id/reset-password — reset password (admin only)
router.patch('/:id/reset-password', auth, adminOnly, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'New password required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, req.params.id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/:id — delete user (admin only, cannot delete self)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  if (Number(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Cannot delete your own account' });
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
