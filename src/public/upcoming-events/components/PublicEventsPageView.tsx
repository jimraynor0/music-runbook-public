import { Accordion, Alert, Spinner, ListGroup, Button } from "react-bootstrap";
import { Event } from '../../../common/types/events';
import { formatFileSize, getFileIcon } from '../../../common/services/fileService';

interface PublicEventsPageViewProps {
  events: Event[];
  loading: boolean;
  error: string | null;
}

function PublicEventsPageView({ events, loading, error }: PublicEventsPageViewProps) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-3">
        <Alert variant="danger">
          {error}
        </Alert>
        <p className="mt-2 text-muted">
          Make sure you have configured your Firebase credentials in a .env file.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Upcoming Events</h1>
      {events.length === 0 ? (
        <p className="mt-4 text-center text-muted">
          No upcoming events found.
        </p>
      ) : (
        <Accordion className="mt-3">
          {events.map((event: Event, index) => (
            <Accordion.Item key={event.id} eventKey={index.toString()}>
              <Accordion.Header>
                  <strong>{new Date(event.date).toLocaleDateString()} - {event.name}</strong>
              </Accordion.Header>
              <Accordion.Body>
                {event.notices && event.notices.length > 0 ? (
                  <ListGroup variant="flush">
                    {event.notices.map((notice) => (
                      <ListGroup.Item key={notice.id}>
                        <div className="mb-2" dangerouslySetInnerHTML={{ __html: notice.text }}></div>
                        {notice.attachments && notice.attachments.length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted fw-bold">Attachments:</small>
                            <div className="mt-1">
                              {notice.attachments.map((attachment) => (
                                <div key={attachment.id} className="d-flex align-items-center mb-1">
                                  <span className="me-2">{getFileIcon(attachment.contentType)}</span>
                                  <Button
                                    variant="link"
                                    className="p-0 text-decoration-none"
                                    onClick={() => window.open(attachment.downloadUrl, '_blank')}
                                  >
                                    {attachment.fileName}
                                  </Button>
                                  <small className="text-muted ms-2">
                                    ({formatFileSize(attachment.fileSize)})
                                  </small>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p className="text-muted mb-0">
                    No notices for this event.
                  </p>
                )}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </div>
  );
}

export default PublicEventsPageView;
