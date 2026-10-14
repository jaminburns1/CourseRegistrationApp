import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function NotFoundPage() {
  return (
    <main className="centered">
      <h1>Page not found</h1>
      <p>
        There is nothing at this address. <Link to="/courses">Go to the course list</Link>.
      </p>
    </main>
  );
}

export default function App() {
  const { status, error, retry } = useAuth();

  if (status === 'loading') {
    return (
      <main className="centered">
        <p role="status">Loading…</p>
      </main>
    );
  }
  if (status === 'error') {
    return (
      <main className="centered">
        <h1>Course Registration</h1>
        <p className="error" role="alert">
          {error}
        </p>
        <button type="button" onClick={retry}>
          Try again
        </button>
      </main>
    );
  }

  const registration = (
    <RequireAuth>
      <RegistrationPage />
    </RequireAuth>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/courses" replace />} />
      <Route path="/courses" element={registration} />
      <Route path="/courses/:courseId" element={registration} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
