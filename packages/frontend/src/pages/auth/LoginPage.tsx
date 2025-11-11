import { useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/index';
import { login, clearError, loginWith2FA, cancel2FA } from '@store/slices/authSlice';
import { Form, Button, Alert, Container, Card, Spinner } from 'react-bootstrap';
import { TwoFactorVerification } from '@components/auth/TwoFactorVerification';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, requires2FA, twoFactorMethod } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // useEffect(() => {
  //   return () => {
  //     dispatch(clearError());
  //   };
  // }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !masterPassword) {
      return;
    }

    try {
      const result= await dispatch(login({ email, masterPassword })).unwrap();
      if (!result.requires2FA) {
        navigate('/vault');
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handle2FAVerification = async (code: string) => {
    try {
      await dispatch(loginWith2FA({ twoFactorCode: code })).unwrap();
      navigate('/vault');
    } catch (err) {
      console.error('2FA verification failed:', err);
    }
  };

  const handleCancel2FA = () => {
    dispatch(cancel2FA());
  };

  if (requires2FA && twoFactorMethod) {
    return (
      <div className="min-vh-100 d-flex align-items-center bg-light">
        <Container>
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <Card className="shadow-lg border-0">
                <Card.Body className="p-4">
                  <TwoFactorVerification
                    method={twoFactorMethod}
                    onVerify={handle2FAVerification}
                    onCancel={handleCancel2FA}
                    isLoading={isLoading}
                    error={error}
                  />
                </Card.Body>
              </Card>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div
                    className="bg-primary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ width: '64px', height: '64px' }}
                  >
                    <i className="bi bi-shield-lock fs-1 text-primary"></i>
                  </div>
                  <h2 className="fw-bold">Welcome Back</h2>
                  <p className="text-muted">Sign in to access your vault</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => dispatch(clearError())}>
                    {error}
                  </Alert>
                )}

                {/* Form */}
                <Form onSubmit={handleSubmit}>
                  {/* Email */}
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </Form.Group>

                  {/* Master Password */}
                  <Form.Group className="mb-3">
                    <Form.Label>Master Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your master password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </Form.Group>

                  {/* Remember Me */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Form.Check
                      type="checkbox"
                      id="remember-me"
                      label="Remember me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <Link to="/forgot-password" className="text-decoration-none small">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit */}
                  <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Form>

                {/* Register Link */}
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-decoration-none">
                      Create one
                    </Link>
                  </small>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}