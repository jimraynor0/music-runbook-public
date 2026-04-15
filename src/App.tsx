import './App.css'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { signOut } from 'firebase/auth';
import PublicEventsPage from './public/upcoming-events/PublicEventsPage';
import AdminPage from './admin/upcoming-events';
import AdminGroupsPage from './admin/groups';
import AdminStudentsPage from './admin/students';
import { AuthProvider, useAuth } from './common/auth/AuthContext';
import ProtectedRoute from './common/auth/ProtectedRoute';
import { auth } from './common/firebase/config';

function NavbarComponent() {
  const location = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Music Runbook</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/events" active={location.pathname === '/events'}>
              Upcoming Events
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/admin/events" active={location.pathname === '/admin/events'}>
              Admin Events
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/groups" active={location.pathname === '/admin/groups'}>
              Admin Groups
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/students" active={location.pathname === '/admin/students'}>
              Admin Students
            </Nav.Link>
            {user && (
              <Button variant="outline-light" size="sm" onClick={handleLogout} className="ms-2">
                Logout
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <NavbarComponent />
          <Container className="mt-4">
            <Routes>
              <Route path="/" element={<Navigate to="/events" replace />} />
              <Route path="/events" element={<PublicEventsPage />} />
              <Route path="/admin/events" element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/groups" element={
                <ProtectedRoute>
                  <AdminGroupsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/students" element={
                <ProtectedRoute>
                  <AdminStudentsPage />
                </ProtectedRoute>
              } />
            </Routes>
          </Container>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
