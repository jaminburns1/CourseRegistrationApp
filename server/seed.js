// Rebuilds the development database from schema.sql and fills it with demo data.
const fs = require('node:fs');
const bcrypt = require('bcryptjs');
const { openDatabase, DEFAULT_DB_PATH } = require('./db');

const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;
const DEMO_PASSWORD = 'password123';

const MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5;

// [title, day, start, capacity, prerequisite titles, description]
const COURSES = [
  ['Intro to Programming', MON, '09:00', 30, [], 'Variables, control flow, functions and problem solving in Python.'],
  ['Discrete Mathematics', MON, '10:00', 30, [], 'Logic, sets, proofs, counting and graphs for computer science.'],
  ['Data Structures', TUE, '10:00', 25, ['Intro to Programming'], 'Lists, trees, hash tables and graphs, and how to choose between them.'],
  ['Web Development', TUE, '10:00', 25, ['Intro to Programming'], 'HTML, CSS, JavaScript and HTTP, from a static page to a small web app.'],
  ['Intro to Philosophy', TUE, '14:00', 2, [], 'Classic questions about knowledge, ethics and the mind. Small seminar.'],
  ['Calculus I', WED, '09:00', 30, [], 'Limits, derivatives and integrals of functions of one variable.'],
  ['Linear Algebra', WED, '09:00', 30, [], 'Vectors, matrices, linear maps and eigenvalues.'],
  ['Algorithms', WED, '11:00', 25, ['Data Structures'], 'Sorting, searching, graph algorithms and how to analyse running time.'],
  ['Databases', THU, '09:00', 25, ['Intro to Programming', 'Data Structures'], 'Relational modelling, SQL, transactions and indexing.'],
  ['Calculus II', THU, '10:00', 30, ['Calculus I'], 'Techniques of integration, sequences and series.'],
  ['Statistics', FRI, '09:00', 30, [], 'Probability, estimation and hypothesis testing with real data.'],
  ['Operating Systems', FRI, '10:00', 20, ['Data Structures', 'Algorithms'], 'Processes, memory, file systems and concurrency.'],
  ['Technical Writing', FRI, '11:00', 3, [], 'Writing clear reports, documentation and emails. Small workshop.'],
  ['Machine Learning', THU, '13:00', 20, ['Algorithms', 'Linear Algebra', 'Statistics'], 'Supervised and unsupervised learning, from linear models to neural networks.'],
];

// Alice and Bob are the demo students; Carol and Dave fill seats.
const USERS = [
  {
    name: 'Alice Nguyen',
    email: 'alice@example.com',
    completed: ['Intro to Programming', 'Data Structures'],
    enrolled: ['Calculus I'],
  },
  {
    name: 'Bob Martinez',
    email: 'bob@example.com',
    completed: ['Intro to Programming'],
    enrolled: [],
  },
  {
    name: 'Carol Smith',
    email: 'carol@example.com',
    completed: [],
    enrolled: ['Intro to Philosophy', 'Technical Writing'],
  },
  {
    name: 'Dave Lee',
    email: 'dave@example.com',
    completed: [],
    enrolled: ['Intro to Philosophy', 'Technical Writing'],
  },
];

for (const suffix of ['', '-wal', '-shm']) {
  fs.rmSync(DB_PATH + suffix, { force: true });
}
const db = openDatabase(DB_PATH);

const seed = db.transaction(() => {
  const insertCourse = db.prepare(
    'INSERT INTO courses (title, description, day_of_week, start_time, capacity) VALUES (?, ?, ?, ?, ?)'
  );
  const insertPrerequisite = db.prepare(
    'INSERT INTO prerequisites (course_id, prerequisite_id) VALUES (?, ?)'
  );
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
  const insertEnrollment = db.prepare(
    'INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, ?)'
  );

  const courseIds = new Map();
  for (const [title, day, start, capacity, , description] of COURSES) {
    courseIds.set(title, insertCourse.run(title, description, day, start, capacity).lastInsertRowid);
  }
  for (const [title, , , , prerequisites] of COURSES) {
    for (const prerequisite of prerequisites) {
      insertPrerequisite.run(courseIds.get(title), courseIds.get(prerequisite));
    }
  }

  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  for (const user of USERS) {
    const userId = insertUser.run(user.name, user.email, passwordHash).lastInsertRowid;
    for (const title of user.completed) insertEnrollment.run(userId, courseIds.get(title), 'completed');
    for (const title of user.enrolled) insertEnrollment.run(userId, courseIds.get(title), 'enrolled');
  }
});
seed();
db.close();

console.log(`Seeded ${COURSES.length} courses and ${USERS.length} students into ${DB_PATH}`);
console.log(`Demo logins: alice@example.com and bob@example.com, password "${DEMO_PASSWORD}"`);
