import { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { generatePassword } from '@utils/crypto';
import { PasswordStrengthMeter } from '@components/common/PasswordStrengthMeter';

interface AddPasswordModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: {
    websiteName: string;
    websiteUrl?: string;
    username: string;
    password: string;
    notes?: string;
    folder?: string;
    favorite?: boolean;
  }) => Promise<void>;
  isLoading: boolean;
}

export const AddPasswordModal: React.FC<AddPasswordModalProps> = ({
  show,
  onHide,
  onSubmit,
  isLoading,
}) => {
  const [websiteName, setWebsiteName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [folder, setFolder] = useState('');
  const [favorite, setFavorite] = useState(false);

  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorLength, setGeneratorLength] = useState(16);
  const [generatorOptions, setGeneratorOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  const handleGeneratePassword = () => {
    const generated = generatePassword(generatorLength, generatorOptions);
    setPassword(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!websiteName || !username || !password) {
      return;
    }

    await onSubmit({
      websiteName,
      websiteUrl: websiteUrl || undefined,
      username,
      password,
      notes: notes || undefined,
      folder: folder || undefined,
      favorite,
    });

    // Reset form
    setWebsiteName('');
    setWebsiteUrl('');
    setUsername('');
    setPassword('');
    setNotes('');
    setFolder('');
    setFavorite(false);
    setShowGenerator(false);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-plus-circle me-2"></i>
          Add Password
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Website Name */}
          <Form.Group className="mb-3">
            <Form.Label>
              Website Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Google, Facebook"
              value={websiteName}
              onChange={(e) => setWebsiteName(e.target.value)}
              required
            />
          </Form.Group>

          {/* Website URL */}
          <Form.Group className="mb-3">
            <Form.Label>Website URL</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </Form.Group>

          {/* Username */}
          <Form.Group className="mb-3">
            <Form.Label>
              Username / Email <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="you@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

          {/* Password with Generator */}
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">
                Password <span className="text-danger">*</span>
              </Form.Label>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-decoration-none"
              >
                <i className="bi bi-magic me-1"></i>
                {showGenerator ? 'Hide Generator' : 'Generate Password'}
              </Button>
            </div>

            <Form.Control
              type="text"
              placeholder="Enter or generate a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <PasswordStrengthMeter password={password} />

            {/* Password Generator */}
            {showGenerator && (
              <Alert variant="light" className="mt-3 mb-0">
                <div className="mb-3">
                  <Form.Label>Length: {generatorLength}</Form.Label>
                  <Form.Range
                    min={8}
                    max={32}
                    value={generatorLength}
                    onChange={(e) => setGeneratorLength(Number(e.target.value))}
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <Form.Check
                      type="checkbox"
                      label="Uppercase (A-Z)"
                      checked={generatorOptions.uppercase}
                      onChange={(e) =>
                        setGeneratorOptions({ ...generatorOptions, uppercase: e.target.checked })
                      }
                    />
                  </div>
                  <div className="col-6">
                    <Form.Check
                      type="checkbox"
                      label="Lowercase (a-z)"
                      checked={generatorOptions.lowercase}
                      onChange={(e) =>
                        setGeneratorOptions({ ...generatorOptions, lowercase: e.target.checked })
                      }
                    />
                  </div>
                  <div className="col-6">
                    <Form.Check
                      type="checkbox"
                      label="Numbers (0-9)"
                      checked={generatorOptions.numbers}
                      onChange={(e) =>
                        setGeneratorOptions({ ...generatorOptions, numbers: e.target.checked })
                      }
                    />
                  </div>
                  <div className="col-6">
                    <Form.Check
                      type="checkbox"
                      label="Symbols (!@#$)"
                      checked={generatorOptions.symbols}
                      onChange={(e) =>
                        setGeneratorOptions({ ...generatorOptions, symbols: e.target.checked })
                      }
                    />
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGeneratePassword}
                  className="w-100"
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Generate Password
                </Button>
              </Alert>
            )}
          </Form.Group>

          {/* Notes */}
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Form.Group>

          {/* Folder */}
          <Form.Group className="mb-3">
            <Form.Label>Folder</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Work, Personal, Banking"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
          </Form.Group>

          {/* Favorite */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Mark as favorite"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
            />
          </Form.Group>

          {/* Actions */}
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onHide} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading} className="flex-grow-1">
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Adding...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-lg me-2"></i>
                  Add Password
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};