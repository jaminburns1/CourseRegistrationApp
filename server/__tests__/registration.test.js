const { openDatabase } = require('../db');
const { register, drop } = require('../registration');
const { requireAuth } = require('../auth');

const MON = 1, TUE = 2;

let db;
let student;
let other;

function addUser(name) {
  return db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, `${name}@example.com`, 'not-used').lastInsertRowid;
}

function addCourse(title, { day = MON, start = '09:00', capacity = 10, prerequisites = [] } = {}) {
  const id = db
    .prepare(
      'INSERT INTO courses (title, description, day_of_week, start_time, capacity) VALUES (?, ?, ?, ?, ?)'
    )
    .run(title, `${title} description`, day, start, capacity).lastInsertRowid;
  for (const prerequisiteId of prerequisites) {
    db.prepare('INSERT INTO prerequisites (course_id, prerequisite_id) VALUES (?, ?)').run(
      id,
      prerequisiteId
    );
  }
  return id;
}

function addEnrollment(userId, courseId, status) {
  db.prepare('INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, ?)').run(
    userId,
    courseId,
    status
  );
}

const enrollmentCount = () => db.prepare('SELECT COUNT(*) AS n FROM enrollments').get().n;

const statusOf = (userId, courseId) =>
  db.prepare('SELECT status FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, courseId)
    ?.status;

// Asserts the registration is refused with the given error and adds no row.
function expectRefused(userId, courseId, { status, code }) {
  const before = enrollmentCount();
  let error;
  try {
    register(db, userId, courseId);
  } catch (err) {
    error = err;
  }
  expect(error).toBeDefined();
  expect(error.code).toBe(code);
  expect(error.status).toBe(status);
  expect(enrollmentCount()).toBe(before);
  return error;
}

beforeEach(() => {
  db = openDatabase(':memory:');
  student = addUser('student');
  other = addUser('other');
});

afterEach(() => {
  db.close();
});

describe('refused registrations', () => {
  test('not logged in: the auth middleware refuses a request with no session', async () => {
    addCourse('Algebra');
    const before = enrollmentCount();
    const ctx = { cookies: { get: () => undefined, set: jest.fn() }, state: {} };
    const next = jest.fn();

    await expect(requireAuth(db)(ctx, next)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(next).not.toHaveBeenCalled();
    expect(enrollmentCount()).toBe(before);
  });


  test('a course at the same time on a different day', () => {
    const algebra = addCourse('Algebra', { day: MON, start: '09:00' });
    const biology = addCourse('Biology', { day: TUE, start: '09:00' });
    register(db, student, algebra);

    register(db, student, biology);

    expect(statusOf(student, biology)).toBe('enrolled');
  });

  test('unknown course', () => {
    expectRefused(student, 99999, {
      status: 404,
      code: 'COURSE_NOT_FOUND'
    });
  });

  test('already enrolled', () => {
    const course = addCourse('Algebra');
    addEnrollment(student, course, 'enrolled');

    expectRefused(student, course, {
      status: 409,
      code: 'ALREADY_ENROLLED'
    });
  });

  test('already completed', () => {
    const course = addCourse('Biology');
    addEnrollment(student, course, 'completed');

    expectRefused(student, course, {
      status: 409,
      code: 'ALREADY_COMPLETED'
    });
  });

  test('missing all prerequisites', () => {
    const intro = addCourse('Intro Programming');
    const math = addCourse('Math');
    const advanced = addCourse('Advanced Programming', {
      prerequisites: [intro, math]
    });

    expectRefused(student, advanced, {
      status: 409,
      code: 'MISSING_PREREQUISITE'
    });
  });

  test('missing one prerequisite', () => {
    const intro = addCourse('Intro Programming');
    const math = addCourse('Math');

    const advanced = addCourse('Advanced Programming', {
      prerequisites: [intro, math]
    });

    addEnrollment(student, intro, 'completed');

    expectRefused(student, advanced, {
      status: 409,
      code: 'MISSING_PREREQUISITE'
    });
  });

  test('prerequisite still in progress', () => {
    const intro = addCourse('Intro Programming');
    const advanced = addCourse('Advanced Programming', {
      prerequisites: [intro]
    });

    addEnrollment(student, intro, 'enrolled');

    expectRefused(student, advanced, {
      status: 409,
      code: 'MISSING_PREREQUISITE'
    });
  });

  test('time conflict', () => {
    const algebra = addCourse('Algebra', {
      day: MON,
      start: '09:00'
    });

    const biology = addCourse('Biology', {
      day: MON,
      start: '09:00'
    });

    addEnrollment(student, algebra, 'enrolled');

    expectRefused(student, biology, {
      status: 409,
      code: 'TIME_CONFLICT'
    });
  });

  test('course is full', () => {
    const course = addCourse('Physics', {
      capacity: 1
    });

    addEnrollment(other, course, 'enrolled');

    expectRefused(student, course, {
      status: 409,
      code: 'COURSE_FULL'
    });
  });

  test('valid registration succeeds', () => {
    const course = addCourse('History', {
      day: MON,
      start: '11:00'
    });

    register(db, student, course);

    expect(statusOf(student, course)).toBe('enrolled');
  });

  test('seat becomes available after drop', () => {
    const course = addCourse('Physics', {
      capacity: 1
    });

    addEnrollment(other, course, 'enrolled');

    expectRefused(student, course, {
      status: 409,
      code: 'COURSE_FULL'
    });

    drop(db, other, course);

    register(db, student, course);

    expect(statusOf(student, course)).toBe('enrolled');
    expect(statusOf(other, course)).toBeUndefined();
  });

});