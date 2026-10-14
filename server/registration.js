
const { AppError } = require('./errors');

function register(db, userId, courseId) {
  const transaction = db.transaction(() => {
    const course = db.prepare(
      'SELECT * FROM courses WHERE id = ?'
    ).get(courseId);

    if (!course) {
      throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found.');
    }

    const existing = db.prepare(
      'SELECT status FROM enrollments WHERE user_id = ? AND course_id = ?'
    ).get(userId, courseId);

    if (existing) {
      const code = existing.status === 'completed'
        ? 'ALREADY_COMPLETED'
        : 'ALREADY_ENROLLED';

      throw new AppError(
        409, code,
        `You have already ${existing.status} ${course.title}.`
      );
    }

    const missing = db.prepare(`
      SELECT c.title
      FROM prerequisites p
      JOIN courses c ON c.id = p.prerequisite_id
      LEFT JOIN enrollments e
        ON e.course_id = p.prerequisite_id
        AND e.user_id = ?
        AND e.status = 'completed'
      WHERE p.course_id = ?
        AND e.user_id IS NULL
    `).all(userId, courseId);

    if (missing.length > 0) {
      throw new AppError(
        409,
        'MISSING_PREREQUISITE',
        `You must complete ${missing.map(c => c.title).join(', ')} first.`
      );
    }

    const conflict = db.prepare(`
      SELECT c.title
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ?
        AND e.status = 'enrolled'
        AND c.day_of_week = ?
        AND c.start_time = ?
    `).get(userId, course.day_of_week, course.start_time);

    if (conflict) {
      throw new AppError(
        409,
        'TIME_CONFLICT',
        `This course conflicts with ${conflict.title}.`
      );
    }

    const count = db.prepare(`
      SELECT COUNT(*) AS total
      FROM enrollments
      WHERE course_id = ? AND status = 'enrolled'
    `).get(courseId).total;

    if (count >= course.capacity) {
      throw new AppError(
        409,
        'COURSE_FULL',
        `${course.title} is full.`
      );
    }

    db.prepare(`
      INSERT INTO enrollments (user_id, course_id, status)
      VALUES (?, ?, 'enrolled')
    `).run(userId, courseId);

    return { success: true };
  });

  return transaction.immediate();
}

function drop(db, userId, courseId) {
  const result = db.prepare(`
    DELETE FROM enrollments
    WHERE user_id = ?
      AND course_id = ?
      AND status = 'enrolled'
  `).run(userId, courseId);

  if (result.changes === 0) {
    throw new AppError(
      409,
      'NOT_ENROLLED',
      'You are not enrolled in this course.'
    );
  }

  return { success: true };
}

module.exports = { register, drop };
