import { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import ProtectedRouteView from './components/ProtectedRouteView';

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  return (
    <ProtectedRouteView
      loading={loading}
      authenticated={!!user}
      renderLogin={() => <LoginPage />}
    >
      {children}
    </ProtectedRouteView>
  );
}

export default ProtectedRoute;