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

// Use Render's PORT in production, fallback to 5000 locally
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enquiries', enquiryRoutes);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Learnova API is running',
    timestamp: new Date().toISOString(),
  });
});

// Root Route
app.get('/', (_req, res) => {
  res.send('Learnova API is running 🚀');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Learnova API running on port ${PORT}`);
});

export default app;