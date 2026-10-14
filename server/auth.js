const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { unauthenticated } = require('./errors');

const SESSION_COOKIE = 'sid';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Compared against when the email is unknown, so both cases take the same time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Returns the user for a correct email and password, otherwise null.
async function verifyCredentials(db, email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const matches = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  return user && matches ? { id: user.id, name: user.name, email: user.email } : null;
}

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    hashToken(token),
    userId,
    Date.now() + SESSION_TTL_MS
  );
  return token;
}

function destroySession(db, token) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

function setSessionCookie(ctx, token) {
  ctx.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: ctx.secure,
    maxAge: SESSION_TTL_MS,
  });
}

function clearSessionCookie(ctx) {
  ctx.cookies.set(SESSION_COOKIE, null, { httpOnly: true, sameSite: 'lax' });
}

// Middleware: refuses the request with 401 unless the cookie names a live
// session. On success the student is available as ctx.state.user.
function requireAuth(db) {
  return async function requireAuthMiddleware(ctx, next) {
    const token = ctx.cookies.get(SESSION_COOKIE);
    if (!token) throw unauthenticated();

    const user = db
      .prepare(
        `SELECT u.id, u.name, u.email
           FROM sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > ?`
      )
      .get(hashToken(token), Date.now());
    if (!user) {
      clearSessionCookie(ctx);
      throw unauthenticated('Your session has expired. Please log in again.');
    }

    ctx.state.user = user;
    ctx.state.sessionToken = token;
    await next();
  };
}

module.exports = {
  SESSION_COOKIE,
  verifyCredentials,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
};
