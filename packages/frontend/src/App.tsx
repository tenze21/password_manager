import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/index';
import { getCurrentUser } from '@store/slices/authSlice';
import { Spinner } from 'react-bootstrap';

// Pages
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import VaultPage from '@pages/vault/VaultPage';

/**
 * Main App Component
 */
function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  // Loading screen
  if (isLoading && !isAuthenticated) {
    return (
      <div className="spinner-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/vault" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/vault" replace /> : <RegisterPage />}
        />

        {/* Protected routes */}
        <Route
          path="/vault"
          element={isAuthenticated ? <VaultPage /> : <Navigate to="/login" replace />}
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/vault' : '/login'} replace />}
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="container text-center mt-5">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary">
                Go Home
              </a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;