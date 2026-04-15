import { useState } from 'react';
import { Container, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import { useEvents } from '../../common/hooks/useEvents';
import { Event } from '../../common/types/events';
import EventForm from './EventForm';
import { deleteEvent } from '../../common/services/eventService';
import EventsTableView from './components/EventsTableView.tsx';

function AdminPage() {
  const [showHistorical, setShowHistorical] = useState(false);
  const { events, loading, error } = useEvents(showHistorical);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="d-flex justify-content-center">
          <div>Loading events...</div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Event Administration</h1>
            <Button variant="primary" onClick={handleAddEvent}>
              Add New Event
            </Button>
          </div>

          <div className="mb-3">
            <Form.Check
              type="switch"
              id="show-historical-toggle"
              label="Show historical events"
              checked={showHistorical}
              onChange={(e) => setShowHistorical(e.target.checked)}
            />
          </div>

          <EventsTableView
            events={events}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <EventForm
            event={editingEvent}
            onSuccess={handleCloseModal}
            onCancel={handleCloseModal}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default AdminPage;