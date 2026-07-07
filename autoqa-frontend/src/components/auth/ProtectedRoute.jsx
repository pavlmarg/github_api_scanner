import { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 60 minutes

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const inactivityTimer = useRef(null);

  // --- 60-minute inactivity auto-logout ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const forceLogout = () => {
      logout();
      navigate('/login', { replace: true });
    };

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(forceLogout, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [isAuthenticated, logout, navigate]);

// --- Log out only if back navigation lands on the login/signup pages ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePopState = () => {
      const nextPath = window.location.pathname;
      if (nextPath === '/login' || nextPath === '/signup') {
        logout();
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, logout, navigate]);

  // --- Guard against bfcache restoring a stale authenticated view ---
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted && !isAuthenticated) {
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;