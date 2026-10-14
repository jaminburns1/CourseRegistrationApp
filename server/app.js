
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const { AppError, errorHandler, badRequest } = require('./errors');
const auth = require('./auth');
const registration = require('./registration');
const {
  requireObjectBody,
  requireString,
  requireCourseId
} = require('./validation');

function createApp(db) {
  const app = new Koa();
  const router = new Router({ prefix: '/api' });
  const requireAuth = auth.requireAuth(db);

  app.use(errorHandler);

  app.use(bodyParser({
    enableTypes: ['json'],
    jsonLimit: '10kb',
    onerror: () => {
      throw badRequest('INVALID_JSON', 'Invalid JSON.');
    }
  }));

  // Login
  router.post('/login', async (ctx) => {
    const body = requireObjectBody(ctx);
    const email = requireString(body.email, 'Email');
    const password = requireString(body.password, 'Password');

    const user = await auth.verifyCredentials(db, email, password);

    if (!user) {
      throw new AppError(
        401,
        'UNAUTHENTICATED',
        'Incorrect email or password.'
      );
    }

    const token = auth.createSession(db, user.id);
    auth.setSessionCookie(ctx, token);

    ctx.body = { user };
  });

  // Everything below requires login
  router.use(requireAuth);

  // Logout
  router.post('/logout', (ctx) => {
    auth.destroySession(db, ctx.state.sessionToken);
    auth.clearSessionCookie(ctx);
    ctx.status = 204;
  });

  // Current student
  router.get('/me', (ctx) => {
    ctx.body = { user: ctx.state.user };
  });

  // Course list
  router.get('/courses', (ctx) => {
    const courses = db.prepare(
      'SELECT id, title FROM courses ORDER BY title'
    ).all();

    ctx.body = { courses };
  });

  // Course details
  router.get('/courses/:id', (ctx) => {
    const courseId = requireCourseId(ctx.params.id);

    const course = db.prepare(
      'SELECT * FROM courses WHERE id = ?'
    ).get(courseId);

    if (!course) {
      throw new AppError(
        404,
        'COURSE_NOT_FOUND',
        'Course not found.'
      );
    }

    const prerequisites = db.prepare(`
      SELECT c.id, c.title
      FROM prerequisites p
      JOIN courses c ON c.id = p.prerequisite_id
      WHERE p.course_id = ?
      ORDER BY c.title
    `).all(courseId);

    const enrolled = db.prepare(`
      SELECT COUNT(*) AS total
      FROM enrollments
      WHERE course_id = ? AND status = 'enrolled'
    `).get(courseId).total;

    const myEnrollment = db.prepare(`
      SELECT status FROM enrollments
      WHERE user_id = ? AND course_id = ?
    `).get(ctx.state.user.id, courseId);

    ctx.body = {
      course: {
        ...course,
        prerequisites,
        seats_left: Math.max(0, course.capacity - enrolled),
        my_status: myEnrollment ? myEnrollment.status : null
      }
    };
  });

  // Student schedule
  router.get('/enrollments', (ctx) => {
    const courses = db.prepare(`
      SELECT c.id, c.title, c.day_of_week, c.start_time
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ? AND e.status = 'enrolled'
      ORDER BY c.day_of_week, c.start_time
    `).all(ctx.state.user.id);

    ctx.body = { courses };
  });

  // Register for a course
  router.post('/enrollments', (ctx) => {
    const body = requireObjectBody(ctx);
    const courseId = requireCourseId(body.courseId);

    registration.register(db, ctx.state.user.id, courseId);

    ctx.status = 201;
    ctx.body = {
      enrollment: {
        courseId,
        status: 'enrolled'
      }
    };
  });

  // Drop a course
  router.delete('/enrollments/:courseId', (ctx) => {
    const courseId = requireCourseId(ctx.params.courseId);

    registration.drop(db, ctx.state.user.id, courseId);

    ctx.status = 204;
  });

  app.use(router.routes());

  app.use((ctx) => {
    throw new AppError(404, 'NOT_FOUND', 'API route not found.');
  });

  return app;
}

module.exports = { createApp };
