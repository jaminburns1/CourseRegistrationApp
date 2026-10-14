
import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Schedule({ dataKey, onChange }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [droppingId, setDroppingId] = useState(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    api.get('/enrollments')
      .then((data) => {
        if (active) {
          setCourses(data.courses);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [dataKey]);

  async function handleDrop(courseId) {
    setDroppingId(courseId);
    setError('');

    try {
      await api.delete(`/enrollments/${courseId}`);
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setDroppingId(null);
    }
  }

  return (
    <div>
      {loading ? (
        <p>Loading your schedule...</p>
      ) : (
        <>
          {error && <p className="error" role="alert">{error}</p>}

          {courses.length === 0 ? (
            <p>You are not enrolled in any courses.</p>
          ) : (
            <ul>
              {courses.map((course) => (
                <li key={course.id}>
                  <strong>{course.title}</strong>
                  <p>
                    Day: {course.day_of_week} —
                    Time: {course.start_time}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDrop(course.id)}
                    disabled={droppingId !== null}
                  >
                    {droppingId === course.id
                      ? 'Dropping...'
                      : 'Drop Course'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
