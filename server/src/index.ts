import express from 'express';
import cors from 'cors';
import { env } from './config/env';

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
import providerOnboardingRoutes from './routes/providerOnboarding';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Middleware
app.use((_req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (env.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(env.uploadsDir, {
  index: false,
  maxAge: env.isProduction ? '7d' : 0,
  immutable: env.isProduction,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/provider-onboarding', providerOnboardingRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: env.nodeEnv, timestamp: new Date().toISOString() });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.listen(env.port, () => {
  console.log(`\n  Learnova API running on port ${env.port} (${env.nodeEnv})\n`);
});

export default app;