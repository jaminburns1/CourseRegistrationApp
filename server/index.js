const { openDatabase } = require('./db');
const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3001;

const db = openDatabase();
const { users } = db.prepare('SELECT COUNT(*) AS users FROM users').get();
if (users === 0) {
  console.warn('The database has no accounts. Run "npm run seed" to create the demo data.');
}

createApp(db).listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
