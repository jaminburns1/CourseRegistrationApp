import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import CourseList from '../components/CourseList.jsx';
import CourseDetails from '../components/CourseDetails.jsx';
import Schedule from '../components/Schedule.jsx';

export default function RegistrationPage() {
  const { courseId } = useParams();
  const { user, logout } = useAuth();
  // clickKey changes on every click in the list, so details are fetched again
  // even when the same course is clicked twice. dataKey changes after every
  // register or drop, so the details panel and the schedule both refresh.
  const [clickKey, setClickKey] = useState(0);
  const [dataKey, setDataKey] = useState(0);
  const [logoutState, setLogoutState] = useState({ pending: false, error: null });

  const handleCourseClick = useCallback(() => setClickKey((key) => key + 1), []);
  const handleRegistrationChange = useCallback(() => setDataKey((key) => key + 1), []);

  async function handleLogout() {
    setLogoutState({ pending: true, error: null });
    try {
      await logout();
    } catch (err) {
      // A 401 here means the session was already gone; auth state handles it.
      setLogoutState({ pending: false, error: err.status === 401 ? null : err.message });
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>Course Registration</h1>
        <div className="topbar-user">
          {logoutState.error && (
            <span className="error" role="alert">
              {logoutState.error}
            </span>
          )}
          <span>{user.name}</span>
          <button type="button" onClick={handleLogout} disabled={logoutState.pending}>
            {logoutState.pending ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </header>

      <main className="columns">
        <section className="panel" aria-labelledby="courses-heading">
          <h2 id="courses-heading">Courses</h2>
          <CourseList selectedId={courseId} onCourseClick={handleCourseClick} />
        </section>

        <section className="panel" aria-labelledby="details-heading">
          <h2 id="details-heading">Course details</h2>
          {courseId ? (
            <CourseDetails
              courseId={courseId}
              clickKey={clickKey}
              dataKey={dataKey}
              onChange={handleRegistrationChange}
            />
          ) : (
            <p className="muted">Select a course from the list to see its details.</p>
          )}
        </section>

        <section className="panel" aria-labelledby="schedule-heading">
          <h2 id="schedule-heading">My schedule</h2>
          <Schedule dataKey={dataKey} onChange={handleRegistrationChange} />
        </section>
      </main>
    </div>
  );
}
