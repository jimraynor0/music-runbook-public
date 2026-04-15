import { Container, Row, Col, Button, Table, Alert, Spinner, Form } from 'react-bootstrap';
import { CsvRow, ImportResult } from '../../../common/services/studentService';
import { Group } from '../../../common/types/group';

interface AdminStudentsPageViewProps {
  groups: Group[];
  groupsLoading: boolean;
  csvRows: CsvRow[] | null;
  parseError: string | null;
  importError: string | null;
  importResult: ImportResult | null;
  importing: boolean;
  onFileSelected: (file: File) => void;
  onImport: () => void;
  onReset: () => void;
}

function AdminStudentsPageView({
  groups,
  groupsLoading,
  csvRows,
  parseError,
  importError,
  importResult,
  importing,
  onFileSelected,
  onImport,
  onReset,
}: AdminStudentsPageViewProps) {
  if (groupsLoading) {
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
          <h1>Student Import</h1>

          {groups.length === 0 && (
            <Alert variant="warning">
              No groups exist yet. Please create groups before importing students.
            </Alert>
          )}

          {parseError && <Alert variant="danger">{parseError}</Alert>}
          {importError && <Alert variant="danger">{importError}</Alert>}
          {importResult && (
            <Alert variant="success">
              Successfully imported {importResult.studentsImported} students
              in {importResult.familiesCreated} families.
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Upload CSV file</Form.Label>
            <Form.Control
              type="file"
              accept=".csv"
              aria-label="Upload CSV"
              onChange={(e) => {
                const input = e.target as HTMLInputElement;
                const file = input.files?.[0];
                if (file) onFileSelected(file);
              }}
            />
            <Form.Text className="text-muted">
              CSV must have columns: first name, last name, group
            </Form.Text>
          </Form.Group>

          {csvRows && csvRows.length > 0 && (
            <>
              <h5>Preview ({csvRows.length} students)</h5>
              <Table striped bordered hover size="sm" className="mb-3">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Group</th>
                  </tr>
                </thead>
                <tbody>
                  {csvRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{row.firstName}</td>
                      <td>{row.lastName || ''}</td>
                      <td>{row.group}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  onClick={onImport}
                  disabled={importing || groups.length === 0}
                >
                  {importing ? 'Importing...' : 'Import Students'}
                </Button>
                <Button variant="secondary" onClick={onReset} disabled={importing}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default AdminStudentsPageView;
