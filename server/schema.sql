-- Course registration schema.
-- Foreign keys are enforced per connection (PRAGMA foreign_keys = ON in db.js).

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL
);

-- Every course meets once a week for one hour.
CREATE TABLE IF NOT EXISTS courses (
  id          INTEGER PRIMARY KEY,
  title       TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday
  start_time  TEXT NOT NULL CHECK (start_time GLOB '[0-2][0-9]:[0-5][0-9]'), -- 24h HH:MM
  capacity    INTEGER NOT NULL CHECK (capacity > 0)
);

-- Many-to-many: a course can require zero or more other courses.
CREATE TABLE IF NOT EXISTS prerequisites (
  course_id       INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  prerequisite_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, prerequisite_id),
  CHECK (course_id <> prerequisite_id)
);

-- One row per student and course.
CREATE TABLE IF NOT EXISTS enrollments (
  user_id   INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  status    TEXT NOT NULL CHECK (status IN ('enrolled', 'completed')),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_status
  ON enrollments (course_id, status);

-- Server-side sessions. Only a SHA-256 hash of the cookie token is stored.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL -- Unix time in milliseconds
);
