import express from 'express';
import cors from 'cors';
import path from 'path';

// Initialize DB (runs schema + seeding)
import './db/database';

import authRoutes from './routes/auth';
import instituteRoutes from './routes/institutes';
import tutorRoutes from './routes/tutors';
import searchRoutes from './routes/search';
import reviewRoutes from './routes/reviews';
import bookmarkRoutes from './routes/bookmarks';
import adminRoutes from './routes/admin';
import enquiryRoutes from './routes/enquiries';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enquiries', enquiryRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n  Learnova API running at http://localhost:${PORT}\n`);
});

export default app;