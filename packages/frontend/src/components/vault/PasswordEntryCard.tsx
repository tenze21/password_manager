import React, { useState } from "react";
import { Card, Button, Badge, Form, InputGroup } from "react-bootstrap";
import { type DecryptedPasswordEntry } from "@password_manager/shared";
import { copyToClipboard } from "@utils/crypto";

interface PasswordEntryProps {
  entry: DecryptedPasswordEntry;
  onEdit: (entry: DecryptedPasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const PasswordEntryCard: React.FC<PasswordEntryProps> = ({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <h5 className="mb-0">{entry.websiteName}</h5>
              {entry.favorite && (
                <i className="bi bi-star-fill text-warning"></i>
              )}
            </div>
            {entry.websiteUrl && (
              <a
                href={entry.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none small text-muted"
              >
                <i className="bi bi-box-arrow-up-right me-1"></i>
                {entry.websiteUrl}
              </a>
            )}
          </div>
          <div className="d-flex gap-1">
            <Button
              variant="link"
              size="sm"
              className="text-warning p-1"
              onClick={() => onToggleFavorite(entry.id)}
              title={
                entry.favorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <i
                className={`bi ${entry.favorite ? "bi-star-fill" : "bi-star"}`}
              ></i>
            </Button>
            <Button
              variant="link"
              size="sm"
              className="text-primary p-1"
              onClick={() => onEdit(entry)}
              title="Edit"
            >
              <i className="bi bi-pencil"></i>
            </Button>
            <Button
              variant="link"
              size="sm"
              className="text-danger p-1"
              onClick={() => onDelete(entry.id)}
              title="Delete"
            >
              <i className="bi bi-trash"></i>
            </Button>
          </div>
        </div>
        {entry.folder && (
          <Badge bg="primary" className="mb-3">
            <i className="bi bi-folder me-1"></i>
            {entry.folder}
          </Badge>
        )}
        <Form.Group className="mb-3">
          <Form.Label className="small text-muted mb-1">Username</Form.Label>
          <InputGroup size="sm">
            <Form.Control
              type="text"
              value={entry.username}
              readOnly
              className="bg-light"
            />
            <Button
              variant="outline-secondary"
              onClick={() => handleCopy(entry.username, 'username')}
              title="Copy username"
            >
              {copiedField === 'username' ? (
                <i className="bi bi-check-lg text-success"></i>
              ) : (
                <i className="bi bi-clipboard"></i>
              )}
            </Button>
          </InputGroup>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="small text-muted mb-1">Password</Form.Label>
          <InputGroup size="sm">
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              value={entry.password}
              readOnly
              className="bg-light font-monospace"
            />
            <Button
              variant="outline-secondary"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => handleCopy(entry.password, 'password')}
              title="Copy password"
            >
              {copiedField === 'password' ? (
                <i className="bi bi-check-lg text-success"></i>
              ) : (
                <i className="bi bi-clipboard"></i>
              )}
            </Button>
          </InputGroup>
        </Form.Group>
        {entry.notes && (
          <Form.Group>
            <Form.Label className="small text-muted mb-1">Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={entry.notes}
              readOnly
              className="bg-light small"
            />
          </Form.Group>
        )}
        <div className="mt-3 pt-3 border-top">
          <small className="text-muted">
            Created: {new Date(entry.createdAt).toLocaleDateString()}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};
