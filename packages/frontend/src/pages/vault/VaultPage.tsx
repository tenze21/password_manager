import { useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  Card,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@store/index";
import { logout } from "@store/slices/authSlice";
import {
  fetchPasswordEntries,
  createPasswordEntry,
  updatePasswordEntry,
  deletePasswordEntry,
  toggleFavorite,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  setSearchQuery,
  setFilterFolder,
} from "@store/slices/vaultSlice";
import { PasswordEntryCard } from "@components/vault/PasswordEntryCard";
import { AddPasswordModal } from "@components/vault/AddPasswordModal";
import { EditPasswordModal } from "@components/vault/EditPasswordModal";

export default function VaultPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    decryptedEntries,
    isLoading,
    isSaving,
    error,
    isAddModalOpen,
    isEditModalOpen,
    selectedEntry,
    searchQuery,
    filterFolder,
  } = useAppSelector((state) => state.vault);

  // Fetch passwords on mount
  useEffect(() => {
    dispatch(fetchPasswordEntries());
  }, [dispatch]);

  // Get unique folders
  const folders = useMemo(() => {
    const folderSet = new Set<string>();
    decryptedEntries.forEach((entry) => {
      if (entry.folder) folderSet.add(entry.folder);
    });
    return Array.from(folderSet).sort();
  }, [decryptedEntries]);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = decryptedEntries;

    // Filter by folder
    if (filterFolder) {
      filtered = filtered.filter((entry) => entry.folder === filterFolder);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.websiteName.toLowerCase().includes(query) ||
          entry.username.toLowerCase().includes(query) ||
          entry.websiteUrl?.toLowerCase().includes(query) ||
          entry.folder?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [decryptedEntries, searchQuery, filterFolder]);

  // Separate favorites
  const favoriteEntries = useMemo(
    () => filteredEntries.filter((entry) => entry.favorite),
    [filteredEntries]
  );

  const regularEntries = useMemo(
    () => filteredEntries.filter((entry) => !entry.favorite),
    [filteredEntries]
  );

  // Handlers
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logout());
    }
  };

  const handleAddPassword = async (data: any) => {
    await dispatch(createPasswordEntry(data)).unwrap();
  };

  const handleEditPassword = async (id: string, data: any) => {
    await dispatch(updatePasswordEntry({ id, data })).unwrap();
  };

  const handleDeletePassword = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this password?")) {
      await dispatch(deletePasswordEntry(id)).unwrap();
    }
  };

  const handleToggleFavorite = (id: string) => {
    dispatch(toggleFavorite(id));
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <header className="bg-white shadow-sm sticky-top">
        <Container fluid className="py-3">
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                >
                  <i className="bi bi-shield-lock fs-4 text-primary"></i>
                </div>
                <div>
                  <h4 className="mb-0">Password Vault</h4>
                  <small className="text-muted">{user?.email}</small>
                </div>
              </div>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => dispatch(openAddModal())}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Add Password
                </Button>
                <Button variant="outline-secondary" as={Link as any} to="/settings">
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </Button>
                <Button variant="outline-secondary" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </header>

      {/* Main Content */}
      <Container fluid className="py-4">
        {/* Search and Filter Bar */}
        <Row className="mb-4">
          <Col md={8}>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search passwords..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              />
            </InputGroup>
          </Col>
          <Col md={4}>
            <Form.Select
              value={filterFolder || ""}
              onChange={(e) =>
                dispatch(setFilterFolder(e.target.value || null))
              }
            >
              <option value="">All Folders</option>
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading your vault...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {decryptedEntries.length === 0 ? (
              <div className="text-center py-5">
                <div
                  className="bg-light rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="bi bi-shield-lock fs-1 text-muted"></i>
                </div>
                <h3>Your vault is empty</h3>
                <p className="text-muted mb-4">
                  Start securing your passwords by adding your first entry
                </p>
                <Button
                  variant="primary"
                  onClick={() => dispatch(openAddModal())}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Add Your First Password
                </Button>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-search fs-1 text-muted"></i>
                <p className="mt-3 text-muted">
                  No passwords match your search or filter
                </p>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <Row className="mb-4">
                  <Col md={4}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <p className="text-muted small mb-1">
                              Total Passwords
                            </p>
                            <h3 className="mb-0">{decryptedEntries.length}</h3>
                          </div>
                          <div
                            className="bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center"
                            style={{ width: "48px", height: "48px" }}
                          >
                            <i className="bi bi-shield-lock fs-4 text-primary"></i>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <p className="text-muted small mb-1">Favorites</p>
                            <h3 className="mb-0">{favoriteEntries.length}</h3>
                          </div>
                          <div
                            className="bg-warning bg-opacity-10 rounded d-flex align-items-center justify-content-center"
                            style={{ width: "48px", height: "48px" }}
                          >
                            <i className="bi bi-star-fill fs-4 text-warning"></i>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <p className="text-muted small mb-1">Folders</p>
                            <h3 className="mb-0">{folders.length}</h3>
                          </div>
                          <div
                            className="bg-success bg-opacity-10 rounded d-flex align-items-center justify-content-center"
                            style={{ width: "48px", height: "48px" }}
                          >
                            <i className="bi bi-folder fs-4 text-success"></i>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Favorites Section */}
                {favoriteEntries.length > 0 && (
                  <div className="mb-4">
                    <h5 className="mb-3">
                      <i className="bi bi-star-fill text-warning me-2"></i>
                      Favorites
                    </h5>
                    <Row xs={1} md={2} lg={3} className="g-3">
                      {favoriteEntries.map((entry) => (
                        <Col key={entry.id}>
                          <PasswordEntryCard
                            entry={entry}
                            onEdit={(entry) => dispatch(openEditModal(entry))}
                            onDelete={handleDeletePassword}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* All Passwords Section */}
                {regularEntries.length > 0 && (
                  <div>
                    <h5 className="mb-3">
                      {favoriteEntries.length > 0
                        ? "All Passwords"
                        : "Your Passwords"}
                    </h5>
                    <Row xs={1} md={2} lg={3} className="g-3">
                      {regularEntries.map((entry) => (
                        <Col key={entry.id}>
                          <PasswordEntryCard
                            entry={entry}
                            onEdit={(entry) => dispatch(openEditModal(entry))}
                            onDelete={handleDeletePassword}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Container>

      {/* Modals */}
      <AddPasswordModal
        show={isAddModalOpen}
        onHide={() => dispatch(closeAddModal())}
        onSubmit={handleAddPassword}
        isLoading={isSaving}
      />

      <EditPasswordModal
        show={isEditModalOpen}
        onHide={() => dispatch(closeEditModal())}
        entry={selectedEntry}
        onSubmit={handleEditPassword}
        isLoading={isSaving}
      />
    </div>
  );
}
