import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/index';
import { register, clearError } from '@store/slices/authSlice';
import { Form, Button, Alert, Container, Card, Spinner } from 'react-bootstrap';
import { PasswordStrengthMeter } from '@components/common/PasswordStrengthMeter';
import { MasterPasswordSchema } from '@password_manager/shared';
import { z } from 'zod';

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    masterPassword: false,
    confirmPassword: false,
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    masterPassword?: string;
    confirmPassword?: string;
  }>({});

  // useEffect(() => {
  //   return () => {
  //     dispatch(clearError());
  //   };
  // }, [dispatch]);

  // Validate on change (real-time validation)
  useEffect(() => {
    if (touched.email || touched.masterPassword || touched.confirmPassword) {
      validateForm();
    }
  }, [email, masterPassword, confirmPassword, touched]);

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    // Master password validation
    if (!masterPassword) {
      errors.masterPassword = 'Master password is required';
    } else {
      try {
        MasterPasswordSchema.parse(masterPassword);
      } catch (err) {
        if (err instanceof z.ZodError) {
          errors.masterPassword = err.issues[0]?.message || 'Invalid password';
        }
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (masterPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Mark all fields as touched
    setTouched({
      email: true,
      masterPassword: true,
      confirmPassword: true,
    });

    if (!validateForm() || !agreedToTerms) {
      return;
    }

    try {
      await dispatch(register({ email, masterPassword })).unwrap();
      navigate('/vault');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <Card className="shadow-lg border-0">
              <Card.Body className="p-4">
                {/* Header */}
                <div className="text-center mb-3">
                  <div
                    className="bg-primary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ width: '64px', height: '64px' }}
                  >
                    <i className="bi bi-shield-lock fs-1 text-primary"></i>
                  </div>
                  <h2 className="fw-bold">Create Account</h2>
                  <p className="text-muted">Secure password management starts here</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => dispatch(clearError())}>
                    {error}
                  </Alert>
                )}

                {/* Form */}
                <Form noValidate onSubmit={handleSubmit}>
                  {/* Email */}
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur('email')}
                      isInvalid={touched.email && !!validationErrors.email}
                      isValid={touched.email && !validationErrors.email && email !== ''}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Master Password */}
                  <Form.Group className="mb-3">
                    <Form.Label>Master Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter a strong master password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      onBlur={() => handleBlur('masterPassword')}
                      isInvalid={touched.masterPassword && !!validationErrors.masterPassword}
                      isValid={touched.masterPassword && !validationErrors.masterPassword && masterPassword !== ''}
                      required
                    />
                    <Form.Text className="text-muted">
                      Use at least 12 characters with uppercase, lowercase, numbers, and symbols
                    </Form.Text>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.masterPassword}
                    </Form.Control.Feedback>
                    <PasswordStrengthMeter password={masterPassword} />
                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Master Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Re-enter your master password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      isInvalid={touched.confirmPassword && !!validationErrors.confirmPassword}
                      isValid={touched.confirmPassword && !validationErrors.confirmPassword && confirmPassword !== ''}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Warning */}
                  <Alert variant="warning" className="py-2">
                    <small>
                      <strong>⚠️ Important:</strong> Your master password cannot be recovered if
                      lost. Make sure to remember it or store it in a safe place.
                    </small>
                  </Alert>

                  {/* Terms */}
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="terms-check"
                      label={
                        <span>
                          I agree to the{' '}
                          <a href="/terms" target="_blank">
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="/privacy" target="_blank">
                            Privacy Policy
                          </a>
                        </span>
                      }
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      required
                    />
                  </Form.Group>

                  {/* Submit */}
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={isLoading || !agreedToTerms}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </Form>

                {/* Login Link */}
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none">
                      Sign in
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