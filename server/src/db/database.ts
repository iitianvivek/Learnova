import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, 'learnova.db'));

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Create schema
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'tutor', 'institute', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS institutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    contact_website TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS institute_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institute_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS institute_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institute_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    fee_structure TEXT NOT NULL DEFAULT '',
    duration TEXT DEFAULT '',
    UNIQUE(institute_id, course_id),
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tutors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    hourly_rate REAL NOT NULL DEFAULT 0,
    bio TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tutor_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutor_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tutor_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutor_id INTEGER NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS institute_star_teachers (
    institute_id INTEGER NOT NULL,
    tutor_id INTEGER NOT NULL,
    PRIMARY KEY (institute_id, tutor_id),
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('institute', 'tutor')),
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reviewer_id, target_id, target_type),
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('institute', 'tutor')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, target_id, target_type),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('institute', 'tutor')),
    message TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new'
        CHECK(status IN ('new', 'read', 'replied')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Migrations for existing databases
try {
  db.exec(
    "ALTER TABLE tutors ADD COLUMN mode TEXT NOT NULL DEFAULT 'both';"
  );
} catch {
  /* already exists */
}

// Seed default courses
const courseCount = (
  db.prepare("SELECT COUNT(*) as count FROM courses").get() as any
).count;

if (courseCount === 0) {
  const insertCourse = db.prepare(
    "INSERT OR IGNORE INTO courses (name, category) VALUES (?, ?)"
  );

  const courses: [string, string][] = [
    ['Mathematics', 'Science'],
    ['Physics', 'Science'],
    ['Chemistry', 'Science'],
    ['Biology', 'Science'],
    ['Computer Science', 'Technology'],
    ['Programming', 'Technology'],
    ['Web Development', 'Technology'],
    ['English', 'Languages'],
    ['Hindi', 'Languages'],
    ['Sanskrit', 'Languages'],
    ['History', 'Humanities'],
    ['Geography', 'Humanities'],
    ['Political Science', 'Humanities'],
    ['Economics', 'Commerce'],
    ['Accountancy', 'Commerce'],
    ['Business Studies', 'Commerce'],
    ['Art & Design', 'Arts'],
    ['Music', 'Arts'],
    ['Physical Education', 'Sports'],
    ['IELTS Preparation', 'Test Prep'],
    ['CUET Preparation', 'Test Prep'],
    ['UPSC Preparation', 'Test Prep'],
    ['JEE Main & Advanced', 'Board Exams'],
    ['NEET', 'Board Exams'],
    ['CBSE Class 10', 'Board Exams'],
    ['CBSE Class 12', 'Board Exams'],
  ];

  for (const [name, category] of courses) {
    insertCourse.run(name, category);
  }

  console.log('Default courses seeded.');
}

// Seed admin user
const adminExists = db
  .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
  .get();

if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);

  db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
  ).run(
    'Admin',
    'admin@learnova.com',
    hash
  );

  console.log(
    'Admin created: admin@learnova.com / admin123'
  );
}

export default db;