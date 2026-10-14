
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function badRequest(code, message) {
  return new AppError(400, code, message);
}

function unauthenticated() {
  return new AppError(401, 'UNAUTHENTICATED', 'Please log in.');
}

async function errorHandler(ctx, next) {
  try {
    await next();
  } catch (err) {
    if (err instanceof AppError) {
      ctx.status = err.status;
      ctx.body = {
        error: {
          code: err.code,
          message: err.message
        }
      };
    } else {
      console.error(err);
      ctx.status = 500;
      ctx.body = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong. Please try again.'
        }
      };
    }
  }
}

module.exports = {
  AppError,
  badRequest,
  unauthenticated,
  errorHandler
};
