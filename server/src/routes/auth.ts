import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database';
import { authenticate, AuthRequest, JWT_EXPIRES_IN, JWT_SECRET } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const {
    name, email, password, role,
    // institute fields
    location, description, contact_email, contact_phone, contact_website,
    // tutor fields
    subject, experience_years, hourly_rate, bio, mode,
  } = req.body;

  if (!name?.trim() || !email?.trim() || !password || !role) {
    res.status(400).json({ error: 'Name, email, password and role are required' });
    return;
  }

  if (!['student', 'tutor', 'institute'].includes(role)) {
    res.status(400).json({ error: 'Role must be student, tutor, or institute' });
    return;
  }

  if (role !== 'student') {
    res.status(400).json({
      error: 'Tutor and academy registration now uses the plan selection flow. Start from provider onboarding instead.',
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'This email is already registered' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(name.trim(), normalizedEmail, hash, role);

  const userId = Number(result.lastInsertRowid);

  const token = jwt.sign({ id: userId, role, name: name.trim() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.status(201).json({
    token,
    user: { id: userId, name: name.trim(), email: normalizedEmail, role },
  });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  const user = db.prepare(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?'
  ).get(req.user!.id) as any;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;