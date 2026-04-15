import { Button, Table } from 'react-bootstrap';
import { Event } from '../../../common/types/events';

interface EventsTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
}

function EventsTableView({ events, onEdit, onDelete }: EventsTableProps) {
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Name</th>
          <th>Date</th>
          <th>Notices</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <td>{event.name}</td>
            <td>{new Date(event.date).toLocaleDateString()}</td>
            <td>
              {event.notices?.length || 0}
              {event.notices?.some(n => n.attachments && n.attachments.length > 0) && (
                <span className="text-muted ms-1">
                  ({event.notices.reduce((total, notice) => total + (notice.attachments?.length || 0), 0)} files)
                </span>
              )}
            </td>
            <td>
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => onEdit(event)}
              >
                Edit
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDelete(event.id)}
              >
                Delete
              </Button>
            </td>
          </tr>
        ))}
        {events.length === 0 && (
          <tr>
            <td colSpan={4} className="text-center text-muted">
              No events found
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

export default EventsTableView;
