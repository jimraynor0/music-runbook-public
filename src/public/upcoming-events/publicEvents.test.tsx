import { beforeEach, describe, it, vi } from 'vitest';
import {
  a_standard_attachment,
  createPublicEventsDsl,
  given_events_exist,
  given_database_is_unavailable,
  reset_default_mocks,
  then_events_are_listed,
  then_no_events_message_is_shown,
  then_error_message_is_shown,
  then_event_has_notices,
  then_attachment_is_shown,
  then_attachment_was_opened_for_download,
} from '../../test/dsl/public/upcoming-events/public_events_dsl';

// ---------------------------------------------------------------------------
// Dumb/presentation component stub (vi.mock is hoisted — must live here)
// ---------------------------------------------------------------------------

vi.mock('./components/PublicEventsPageView', () => ({
  default: ({
    events,
    loading,
    error,
  }: {
    events: {
      id: string;
      name: string;
      date: string;
      notices?: {
        id: string;
        text: string;
        attachments?: { id: string; fileName: string; fileSize: number; contentType: string; downloadUrl: string }[];
      }[];
    }[];
    loading: boolean;
    error: string | null;
  }) => {
    if (loading) {
      return <div role="status">Loading...</div>;
    }

    if (error) {
      return <div role="alert">{error}</div>;
    }

    if (events.length === 0) {
      return <p>No upcoming events found.</p>;
    }

    return (
      <div data-testid="public-events">
        {events.map(event => (
          <div key={event.id}>
            <span>{new Date(event.date).toLocaleDateString()} - {event.name}</span>
            {event.notices?.map(notice => (
              <div key={notice.id}>
                <span>{notice.text}</span>
                {notice.attachments?.map(attachment => (
                  <div key={attachment.id}>
                    <button onClick={() => window.open(attachment.downloadUrl, '_blank')}>
                      {attachment.fileName}
                    </button>
                    <span>({attachment.fileSize} bytes)</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Public Events page', () => {
  let visitor: ReturnType<typeof createPublicEventsDsl>;

  beforeEach(() => {
    vi.clearAllMocks();
    reset_default_mocks();
    visitor = createPublicEventsDsl();
  });

  describe('Event display', () => {
    it('Given no events exist, when a visitor navigates to the events page, then a no events message is shown', async () => {
      await visitor.navigatesToEventsPage();
      await then_no_events_message_is_shown();
    });

    it('Given two events exist, when a visitor navigates to the events page, then both events are listed', async () => {
      given_events_exist([
        { id: 'evt-1', name: 'Spring Concert', date: '2026-05-15' },
        { id: 'evt-2', name: 'Autumn Showcase', date: '2026-09-20' },
      ]);
      await visitor.navigatesToEventsPage();
      await then_events_are_listed(['Spring Concert', 'Autumn Showcase']);
    });

    it('Given the events database is unavailable, when a visitor navigates to the events page, then an error message is shown', async () => {
      given_database_is_unavailable();
      await visitor.navigatesToEventsPage();
      await then_error_message_is_shown(/failed to connect to database/i);
    });
  });

  describe('Notices and attachments', () => {
    it('Given an event has notices, when a visitor navigates to the events page, then the notices are displayed', async () => {
      given_events_exist([
        {
          id: 'evt-1',
          name: 'Spring Concert',
          date: '2026-05-15',
          notices: [{ id: 'notice-1', text: 'Rehearsal at 3pm', attachments: [] }],
        },
      ]);
      await visitor.navigatesToEventsPage();
      await then_event_has_notices(['Rehearsal at 3pm']);
    });

    it('Given an event has a notice with an attachment, when a visitor navigates to the events page, then the attachment is shown', async () => {
      given_events_exist([
        {
          id: 'evt-1',
          name: 'Spring Concert',
          date: '2026-05-15',
          notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [a_standard_attachment()] }],
        },
      ]);
      await visitor.navigatesToEventsPage();
      await then_attachment_is_shown('notice.pdf');
    });

    it('Given an event has a notice with an attachment, when a visitor clicks the attachment, then it opens in a new tab', async () => {
      given_events_exist([
        {
          id: 'evt-1',
          name: 'Spring Concert',
          date: '2026-05-15',
          notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [a_standard_attachment()] }],
        },
      ]);
      await visitor.navigatesToEventsPage();
      await visitor.clicksAttachmentLink('notice.pdf');
      then_attachment_was_opened_for_download('https://cdn.example.com/notice.pdf');
    });
  });
});
