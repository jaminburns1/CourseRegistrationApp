import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../api.js';

export default function CourseList({ selectedId, onCourseClick }) {
  const [state, setState] = useState({ status: 'loading', courses: [], error: null });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', courses: [], error: null });
    api
      .get('/courses', { signal: controller.signal })
      .then((data) => setState({ status: 'ready', courses: data.courses, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', courses: [], error: err.message });
      });
    return () => controller.abort();
  }, [retryKey]);

  if (state.status === 'loading') {
    return (
      <p className="muted" role="status">
        Loading courses…
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <div>
        <p className="error" role="alert">
          {state.error}
        </p>
        <button type="button" onClick={() => setRetryKey((key) => key + 1)}>
          Try again
        </button>
      </div>
    );
  }
  if (state.courses.length === 0) {
    return <p className="muted">No courses are being offered right now.</p>;
  }

  return (
    <ul className="course-list">
      {state.courses.map((course) => (
        <li key={course.id}>
          <NavLink
            to={`/courses/${course.id}`}
            className={String(course.id) === selectedId ? 'course-link selected' : 'course-link'}
            aria-current={String(course.id) === selectedId ? 'true' : undefined}
            onClick={onCourseClick}
          >
            {course.title}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
