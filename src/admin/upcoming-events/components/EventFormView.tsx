import { Form, Button, Alert, Row, Col, Accordion } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Notice } from '../../../common/types/events';

interface EventFormViewProps {
  name: string;
  date: string;
  notices: Notice[];
  newNoticeText: string;
  loading: boolean;
  error: string | null;
  persistingAttachments: boolean;
  isEditing: boolean;
  onNameChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onNewNoticeTextChange: (value: string) => void;
  onAddNotice: () => void;
  onRemoveNotice: (noticeId: string) => void;
  onNoticeTextChange: (noticeId: string, content: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  renderNoticeAttachments: (notice: Notice) => React.ReactNode;
}

function EventFormView({
  name,
  date,
  notices,
  newNoticeText,
  loading,
  error,
  persistingAttachments,
  isEditing,
  onNameChange,
  onDateChange,
  onNewNoticeTextChange,
  onAddNotice,
  onRemoveNotice,
  onNoticeTextChange,
  onSubmit,
  onCancel,
  renderNoticeAttachments,
}: EventFormViewProps) {
  return (
    <Form onSubmit={onSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      {persistingAttachments && <Alert variant="info">Saving attachments...</Alert>}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Event Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Notices</Form.Label>

        {notices.map((notice, index) => (
          <Accordion key={notice.id} className="mb-2">
            <Accordion.Item eventKey={index.toString()}>
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                  <span>{notice.text ? notice.text.replace(/<[^>]*>/g, '').substring(0, 50) + (notice.text.replace(/<[^>]*>/g, '').length > 50 ? '...' : '') : 'New Notice'}</span>
                  {notice.attachments && notice.attachments.length > 0 && (
                    <span className="badge bg-secondary">{notice.attachments.length} attachment(s)</span>
                  )}
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Notice Text</Form.Label>
                  <div className="mb-2">
                    <ReactQuill
                      theme="snow"
                      value={notice.text}
                      onChange={(content) => onNoticeTextChange(notice.id, content)}
                      placeholder="Enter notice text..."
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link'],
                          ['clean']
                        ]
                      }}
                      formats={[
                        'header', 'bold', 'italic', 'underline', 'strike',
                        'list', 'bullet', 'link'
                      ]}
                    />
                  </div>
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onRemoveNotice(notice.id)}
                    >
                      Remove Notice
                    </Button>
                  </div>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Attachments</Form.Label>
                  {renderNoticeAttachments(notice)}
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        ))}

        <div className="d-flex">
          <Form.Control
            type="text"
            placeholder="Add a new notice..."
            value={newNoticeText}
            onChange={(e) => onNewNoticeTextChange(e.target.value)}
            className="me-2"
          />
          <Button
            variant="outline-primary"
            size="sm"
            onClick={onAddNotice}
            disabled={!newNoticeText.trim()}
          >
            Add Notice
          </Button>
        </div>
      </Form.Group>

      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onCancel} className="me-2">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
        </Button>
      </div>
    </Form>
  );
}

export default EventFormView;
