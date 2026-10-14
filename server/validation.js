
const { badRequest } = require('./errors');

function requireObjectBody(ctx) {
  const body = ctx.request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('INVALID_BODY', 'A JSON object is required.');
  }
  return body;
}

function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw badRequest('INVALID_INPUT', `${field} is required.`);
  }
  return value.trim();
}

function requireCourseId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw badRequest('INVALID_COURSE_ID', 'Enter a valid course ID.');
  }
  return id;
}

module.exports = {
  requireObjectBody,
  requireString,
  requireCourseId
};
