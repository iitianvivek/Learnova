import path from 'path';

const DEFAULT_JWT_SECRET = 'learnova_jwt_secret_2024_local_only_do_not_share';
const DEFAULT_ADMIN_EMAIL = 'learnova63@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Learnova@1234';

function normalizeText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function resolvePath(value: string) {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCorsOrigins(value: string | undefined) {
  const raw = value?.trim() || 'http://localhost:3000';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const nodeEnv = normalizeText(process.env.NODE_ENV, 'development');
const isProduction = nodeEnv === 'production';
const dataDir = resolvePath(normalizeText(process.env.DATA_DIR, 'data'));
const uploadsDir = resolvePath(normalizeText(process.env.UPLOADS_DIR, 'uploads'));
const databasePath = process.env.DATABASE_PATH?.trim()
  ? resolvePath(process.env.DATABASE_PATH)
  : path.join(dataDir, 'learnova.db');
const jwtSecret = normalizeText(process.env.JWT_SECRET, DEFAULT_JWT_SECRET);

if (isProduction && jwtSecret === DEFAULT_JWT_SECRET) {
  throw new Error('JWT_SECRET must be set to a strong custom value in production.');
}

const adminPassword = normalizeText(process.env.ADMIN_PASSWORD, DEFAULT_ADMIN_PASSWORD);
if (isProduction && adminPassword === DEFAULT_ADMIN_PASSWORD) {
  console.warn('ADMIN_PASSWORD is using the local default value. Set a custom production password before going live.');
}

export const env = {
  nodeEnv,
  isProduction,
  port: parsePositiveInteger(process.env.PORT, 5000),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  jwtSecret,
  jwtExpiresIn: normalizeText(process.env.JWT_EXPIRES_IN, '7d'),
  dataDir,
  uploadsDir,
  databasePath,
  adminEmail: normalizeText(process.env.ADMIN_EMAIL, DEFAULT_ADMIN_EMAIL).toLowerCase(),
  adminPassword,
};

export function resolveUploadFilePath(filePath: string) {
  return path.join(env.uploadsDir, filePath);
}