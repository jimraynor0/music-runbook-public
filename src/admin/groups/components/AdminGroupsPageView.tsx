import { Container, Row, Col, Table, Button, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { Group } from '../../../common/types/group';

interface AdminGroupsPageViewProps {
  groups: Group[];
  loading: boolean;
  error: string | null;
  newGroupName: string;
  editingGroup: Group | null;
  editName: string;
  onNewGroupNameChange: (value: string) => void;
  onAddGroup: () => void;
  onStartEdit: (group: Group) => void;
  onEditNameChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteGroup: (id: string) => void;
}

function AdminGroupsPageView({
  groups,
  loading,
  error,
  newGroupName,
  editingGroup,
  editName,
  onNewGroupNameChange,
  onAddGroup,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteGroup,
}: AdminGroupsPageViewProps) {
  if (loading) {
    return (
      <Container className="mt-4">
        <div className="d-flex justify-content-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h1>Group Administration</h1>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form
            className="mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              onAddGroup();
            }}
          >
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="New group name"
                aria-label="New group name"
                value={newGroupName}
                onChange={(e) => onNewGroupNameChange(e.target.value)}
              />
              <Button variant="primary" type="submit" disabled={!newGroupName.trim()}>
                Add Group
              </Button>
            </InputGroup>
          </Form>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center text-muted">
                    No groups yet. Add one above.
                  </td>
                </tr>
              )}
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>
                    {editingGroup?.id === group.id ? (
                      <InputGroup>
                        <Form.Control
                          type="text"
                          value={editName}
                          aria-label="Edit group name"
                          onChange={(e) => onEditNameChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onSaveEdit();
                            if (e.key === 'Escape') onCancelEdit();
                          }}
                        />
                      </InputGroup>
                    ) : (
                      group.name
                    )}
                  </td>
                  <td>
                    {editingGroup?.id === group.id ? (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          className="me-2"
                          onClick={onSaveEdit}
                          disabled={!editName.trim()}
                        >
                          Save
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onCancelEdit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => onStartEdit(group)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDeleteGroup(group.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminGroupsPageView;
