import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';

interface LoginPageViewProps {
  loading: boolean;
  error: string | null;
  onSignIn: () => void;
}

function LoginPageView({ loading, error, onSignIn }: LoginPageViewProps) {
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Header className="text-center">
          <h4>Staff Login</h4>
        </Card.Header>
        <Card.Body>
          <p className="text-center text-muted mb-4">
            Please sign in to access the staff panel
          </p>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Alert variant="info" className="mb-3">
            <small>
              <strong>Note:</strong> Only pre-authorized staff accounts can access this system.
              Contact your administrator if you need access.
            </small>
          </Alert>

          <div className="d-grid">
            <Button
              variant="danger"
              onClick={onSignIn}
              disabled={loading}
              className="d-flex align-items-center justify-content-center"
            >
              {loading ? (
                <Spinner animation="border" size="sm" className="me-2" />
              ) : (
                <span className="me-2">📧</span>
              )}
              Sign in with Google
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPageView;
