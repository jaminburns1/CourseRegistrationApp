# Course Registration App

## About

This app allows students to log in, view courses, register for classes, and manage their schedules. It uses React, Node.js, Koa, and SQLite.

## How to Run

Open the project folder in VS Code and run:

```
npm install
npm run seed
npm run dev
```

Open http://localhost:5173 to use the app.

To run the tests:

```
npm test
```

## Demo Accounts

| Email | Password |
|---|---|
| alice@example.com | password123 |
| bob@example.com | password123 |

There is no sign-up. Student accounts are created by the seed script.

## Features

- Log in and log out
- View courses and course details
- Register for classes
- Drop classes
- View and update your schedule
- Stay logged in after refreshing

## Registration Rules

Students cannot register if:

- They already took or completed the class.
- They have not completed the prerequisites.
- Another class meets at the same time.
- The class is full.

The app displays an error explaining why registration failed.

## API Routes

| Route | Purpose |
|---|---|
| POST /api/login | Log in |
| POST /api/logout | Log out |
| GET /api/me | Current student |
| GET /api/courses | Course list |
| GET /api/courses/:id | Course details |
| GET /api/enrollments | My schedule |
| POST /api/enrollments | Register |
| DELETE /api/enrollments/:courseId | Drop course |

Only login works without a session. Errors return JSON with an error code and message using HTTP status codes 400, 401, 404, 409, or 500.

## Preventing Overbooking

The API uses a SQLite transaction to check available seats and register a student together. SQLite locks the database for writing during this process, so two students cannot take the last seat at the same time.

## Testing

The project uses Jest with an in-memory SQLite database. All 12 tests passed, including tests for failed and successful registrations.

## Security

Passwords are hashed with bcrypt. Sessions use HTTP-only cookies, and the server checks that students can only change their own schedules.

## Project Files

- `client/` — React website
- `server/` — Koa API and registration rules
- `server/schema.sql` — Database structure
- `server/seed.js` — Demo data
- `server/__tests__/` — Unit tests

## Stretch Goals

None 