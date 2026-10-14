
import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function CourseDetails({
  courseId,
  clickKey,
  dataKey,
  onChange
}) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    let active = true;

    setCourse(null);
    setLoading(true);
    setError('');

    api.get(`/courses/${courseId}`)
      .then((data) => {
        if (active) {
          setCourse(data.course);
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
  }, [courseId, clickKey, dataKey]);

  async function handleRegister() {
    setRegistering(true);
    setError('');

    try {
      await api.post('/enrollments', {
        courseId: Number(courseId)
      });

      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return <p>Loading course details...</p>;
  }

  if (error && !course) {
    return <p className="error" role="alert">{error}</p>;
  }

  if (!course) {
    return <p>Select a course to see its details.</p>;
  }

  return (
    <div>
      <h3>{course.title}</h3>

      <p>{course.description}</p>

      <p>Day: {course.day_of_week}</p>

      <p>Time: {course.start_time}</p>

      <p>Seats left: {course.seats_left}</p>

      <h4>Prerequisites</h4>

      {course.prerequisites?.length > 0 ? (
        <ul>
          {course.prerequisites.map((prerequisite) => (
            <li key={prerequisite.id}>
              {prerequisite.title}
            </li>
          ))}
        </ul>
      ) : (
        <p>None</p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleRegister}
        disabled={
          registering ||
          loading ||
          Boolean(course.my_status)
        }
      >
        {registering
          ? 'Registering...'
          : course.my_status === 'enrolled'
          ? 'Already Enrolled'
          : course.my_status === 'completed'
          ? 'Already Completed'
          : 'Register'}
      </button>
    </div>
  );
}
