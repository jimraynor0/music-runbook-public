import { ReactNode } from 'react';
import { Spinner } from 'react-bootstrap';

interface ProtectedRouteViewProps {
  loading: boolean;
  authenticated: boolean;
  children: ReactNode;
  renderLogin: () => ReactNode;
}

function ProtectedRouteView({ loading, authenticated, children, renderLogin }: ProtectedRouteViewProps) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!authenticated) {
    return <>{renderLogin()}</>;
  }

  return <>{children}</>;
}

export default ProtectedRouteView;
