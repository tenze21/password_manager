import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Alert,
  Badge,
  Spinner,
} from "react-bootstrap";
import { useAppSelector } from "@/store/index";
import { api, getErrorMessage } from "@services/api";
import { TwoFactorMethod } from "@password_manager/shared";
import { Link } from "react-router-dom";

export default function SettingPage() {
  const { user } = useAppSelector((state) => state.auth);

  const [twoFactorStatus, setTwoFactorStatus] = useState<{
    enabled: boolean;
    method: TwoFactorMethod | null;
    hasBackupCodes: boolean;
  }>({ enabled: false, method: null, hasBackupCodes: false });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TOTP Setup Modal
  const [showTOTPModal, setShowTOTPModal] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQRCode, setTotpQRCode] = useState("");
  const [totpBackupCodes, setTotpBackupCodes] = useState<string[]>([]);
  const [totpVerificationCode, setTotpVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Backup Codes Modal
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(()=>{
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus= async ()=>{
    try {
        setIsLoading(true);
        const response= await api.get('/api/2fa/status');
        setTwoFactorStatus(response.data.data);
    } catch (err) {
        setError(getErrorMessage(err));
    }finally{
        setIsLoading(false);
    }
  };

  const handleSetupTOTP= async ()=>{
    try {
        setError(null);
        const response = await api.post('/api/2fa/totp/setup');
        const {secret, qrCode, backupCodes}= response.data.data;

        setTotpSecret(secret);
        setTotpQRCode(qrCode);
        setTotpBackupCodes(backupCodes);
        setShowTOTPModal(true);
    } catch (err) {
        setError(getErrorMessage(err));
    }
  }

  const handleVerifyTOTP = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      
      await api.post('/api/2fa/totp/verify', {
        code: totpVerificationCode,
      });
      
      setShowTOTPModal(false);
      setTotpVerificationCode('');
      fetchTwoFactorStatus();
      
      // Show backup codes
      setBackupCodes(totpBackupCodes);
      setShowBackupCodesModal(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEnableEmailOTP = async () => {
    try {
      setError(null);
      await api.post('/api/2fa/email/enable');
      fetchTwoFactorStatus();
      alert('Email 2FA enabled successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }
    
    try {
      setError(null);
      await api.post('/api/2fa/disable');
      fetchTwoFactorStatus();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      setError(null);
      const response = await api.post('/api/2fa/backup-codes/regenerate');
      setBackupCodes(response.data.data.backupCodes);
      setShowBackupCodesModal(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'password-manager-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading settings...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col lg={8} className="mx-auto">
          <Button as={Link as any} to="/vault"><i className="bi bi-arrow-left"></i></Button>
          <h2 className="mb-4">Settings</h2>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Account Information */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Account Information</h5>
              <div className="mb-2">
                <strong>Email:</strong> {user?.email}
              </div>
              <div className="mb-2">
                <strong>Account Created:</strong>{' '}
                {user?.createdAt && new Date(user.createdAt).toLocaleDateString()}
              </div>
            </Card.Body>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Two-Factor Authentication</h5>
                {twoFactorStatus.enabled && (
                  <Badge bg="success">
                    <i className="bi bi-shield-check me-1"></i>
                    Enabled
                  </Badge>
                )}
              </div>

              <p className="text-muted">
                Add an extra layer of security to your account by requiring a verification code in
                addition to your password.
              </p>

              {!twoFactorStatus.enabled ? (
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={handleSetupTOTP}>
                    <i className="bi bi-phone me-2"></i>
                    Enable Authenticator App (TOTP)
                  </Button>
                  <Button variant="outline-primary" onClick={handleEnableEmailOTP}>
                    <i className="bi bi-envelope me-2"></i>
                    Enable Email 2FA
                  </Button>
                </div>
              ) : (
                <div>
                  <Alert variant="success" className="mb-3">
                    <i className="bi bi-shield-check me-2"></i>
                    2FA is enabled using{' '}
                    <strong>
                      {twoFactorStatus.method === TwoFactorMethod.TOTP
                        ? 'Authenticator App'
                        : 'Email'}
                    </strong>
                  </Alert>

                  {twoFactorStatus.method === TwoFactorMethod.TOTP && twoFactorStatus.hasBackupCodes && (
                    <Button
                      variant="outline-secondary"
                      onClick={handleRegenerateBackupCodes}
                      className="me-2 mb-2"
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Regenerate Backup Codes
                    </Button>
                  )}

                  <Button variant="outline-danger" onClick={handleDisable2FA} className="mb-2">
                    <i className="bi bi-x-circle me-2"></i>
                    Disable 2FA
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* TOTP Setup Modal */}
      <Modal show={showTOTPModal} onHide={() => setShowTOTPModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Setup Authenticator App</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <h6 className="mb-3">Step 1: Scan QR Code</h6>
            <p className="text-muted small">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {totpQRCode && <img src={totpQRCode} alt="QR Code" className="img-fluid mb-3" />}
            
            <details className="text-start">
              <summary className="text-muted small">Can't scan? Enter manually</summary>
              <code className="d-block mt-2 p-2 bg-light rounded">{totpSecret}</code>
            </details>
          </div>

          <hr />

          <div className="mb-4">
            <h6 className="mb-3">Step 2: Enter Verification Code</h6>
            <Form.Group>
              <Form.Label>Enter the 6-digit code from your app</Form.Label>
              <Form.Control
                type="text"
                placeholder="000000"
                value={totpVerificationCode}
                onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </Form.Group>
          </div>

          <Button
            variant="primary"
            onClick={handleVerifyTOTP}
            disabled={totpVerificationCode.length !== 6 || isVerifying}
            className="w-100"
          >
            {isVerifying ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Verifying...
              </>
            ) : (
              'Verify and Enable'
            )}
          </Button>
        </Modal.Body>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal show={showBackupCodesModal} onHide={() => setShowBackupCodesModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Backup Codes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>⚠️ Important:</strong> Save these backup codes in a secure place. Each code can
            only be used once if you lose access to your authenticator app.
          </Alert>

          <div className="bg-light p-3 rounded font-monospace">
            {backupCodes.map((code, index) => (
              <div key={index} className="mb-1">
                {code}
              </div>
            ))}
          </div>

          <Button variant="primary" onClick={downloadBackupCodes} className="w-100 mt-3">
            <i className="bi bi-download me-2"></i>
            Download Backup Codes
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
