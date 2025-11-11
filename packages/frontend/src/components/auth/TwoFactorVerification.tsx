import React, { useState } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { TwoFactorMethod } from "@password_manager/shared";

interface TwoFactorVerificationProps {
  method: TwoFactorMethod;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  method,
  onVerify,
  onCancel,
  isLoading,
  error,
}) => {
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      await onVerify(code);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div
          className="bg-primary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
          style={{ width: "64px", height: "64px" }}
        >
          <i className="bi bi-shield-lock fs-1 text-primary"></i>
        </div>
        <h4 className="fw-bold">Two-Factor Authentication</h4>
        <p className="text-muted">
          {method === TwoFactorMethod.TOTP
            ? "Enter the 6-digit code from your authenticator app"
            : "Enter the 6-digit code sent to your email"}
        </p>
      </div>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      {method === TwoFactorMethod.EMAIL && (
        <Alert variant="info" className="mb-3">
          <i className="bi bi-envelope me-2"></i>A verification code has been
          sent to your email. It will be valid only for 5 minutes.
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Verification Code</Form.Label>
          <Form.Control
            type="text"
            placeholder="000000"
            value={code}
            onChange={handleCodeChange}
            maxLength={6}
            className="text-center fs-4 font-monospace"
            style={{ letterSpacing: "0.5em" }}
            autoFocus
            disabled={isLoading}
          />
          <Form.Text className="text-muted">
            Enter the 6-digit code
            {method === TwoFactorMethod.TOTP && "from your authenticator app"}
          </Form.Text>
        </Form.Group>

        {method === TwoFactorMethod.TOTP && (
          <div className="text-center mb-3">
            <small className="text-muted">
              Lost your device?{" "}
              <a href="#" className="text-decoration-none">
                Use a backup code
              </a>
            </small>
          </div>
        )}
        <div className="d-grid gap-2">
          <Button
            type="submit"
            variant="primary"
            disabled={code.length !== 6 || isLoading}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Verifying...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Verify
              </>
            )}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};
