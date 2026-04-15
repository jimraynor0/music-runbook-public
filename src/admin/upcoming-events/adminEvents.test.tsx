import {beforeEach, describe, it, vi} from 'vitest';
import {
  a_standard_attachment,
  createAdminDsl,
  given_an_authenticated_admin_session,
  given_a_past_and_future_event_exist,
  given_an_event_exists,
  given_events_exist,
  given_attachment_delete_fails,
  given_attachment_delete_unauthorized,
  given_database_is_unavailable,
  given_delete_confirmed,
  given_download_url_fails_after_upload,
  given_file_upload_succeeds,
  given_firestore_delete_fails,
  given_firestore_save_fails,
  given_firestore_update_fails,
  reset_default_mocks,
  then_admin_page_is_visible,
  then_attachment_was_opened_for_download,
  then_delete_alert_was_shown,
  then_error_message_is_shown,
  then_event_was_deleted_from_firestore,
  then_event_was_saved_to_firestore,
  then_event_was_saved_with_a_notice,
  then_event_was_updated_in_firestore,
  then_event_was_updated_with_notice_text,
  then_event_was_updated_without_notices,
  then_file_was_deleted_from_storage,
  then_file_was_uploaded_to_storage,
  then_historical_toggle_is_checked,
  then_historical_toggle_is_not_checked,
  then_event_is_not_listed,
  then_events_are_listed,
  then_no_upload_was_attempted,
  then_notices_were_persisted,
  then_upload_was_silently_abandoned,
} from '../../test/dsl/admin/upcoming-events/admin_dsl';

// ---------------------------------------------------------------------------
// Dumb/presentation component stubs (vi.mock is hoisted — must live here)
// ---------------------------------------------------------------------------

vi.mock('./components/EventsTableView', () => ({
  default: ({ events, onEdit, onDelete }: { events: unknown[], onEdit: (e: unknown) => void, onDelete: (id: string) => void }) => (
    <div data-testid="events-table">
      {(events as { id: string, name: string }[]).map(e => (
        <div key={e.id}>
          <span>{e.name}</span>
          <button onClick={() => onEdit(e)}>Edit {e.name}</button>
          <button onClick={() => onDelete(e.id)}>Delete {e.name}</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./components/EventFormView', () => ({
  default: ({
    name,
    date,
    notices,
    newNoticeText,
    loading,
    error,
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
  }: {
    name: string;
    date: string;
    notices: { id: string; text: string; attachments?: unknown[] }[];
    newNoticeText: string;
    loading: boolean;
    error: string | null;
    isEditing: boolean;
    onNameChange: (v: string) => void;
    onDateChange: (v: string) => void;
    onNewNoticeTextChange: (v: string) => void;
    onAddNotice: () => void;
    onRemoveNotice: (id: string) => void;
    onNoticeTextChange: (id: string, content: string) => void;
    onSubmit: (e: { preventDefault: () => void }) => void;
    onCancel: () => void;
    renderNoticeAttachments: (notice: { id: string; text: string; attachments?: unknown[] }) => unknown;
  }) => (
    <form onSubmit={onSubmit as (e: unknown) => void}>
      {error && <div role="alert">{error}</div>}
      <input aria-label="Event Name" value={name} onChange={e => onNameChange(e.target.value)} />
      <input aria-label="Date" type="date" value={date} onChange={e => onDateChange(e.target.value)} />
      {notices.map(notice => (
        <div key={notice.id}>
          <input
            aria-label={`Notice text ${notice.id}`}
            value={notice.text}
            onChange={e => onNoticeTextChange(notice.id, e.target.value)}
          />
          <button type="button" onClick={() => onRemoveNotice(notice.id)}>Remove Notice {notice.id}</button>
          {renderNoticeAttachments(notice) as React.ReactNode}
        </div>
      ))}
      <input
        aria-label="New notice text"
        value={newNoticeText}
        onChange={e => onNewNoticeTextChange(e.target.value)}
      />
      <button type="button" onClick={onAddNotice}>Add Notice</button>
      <button type="button" onClick={onCancel}>Cancel</button>
      <button type="submit" disabled={loading}>{isEditing ? 'Update Event' : 'Create Event'}</button>
    </form>
  ),
}));

vi.mock('./components/FileUploadView', () => ({
  default: ({
    attachments,
    error,
    fileInputRef,
    onFileInputChange,
    onDownload,
    onDelete,
  }: {
    attachments: { id: string; fileName: string; downloadUrl: string }[];
    error: string | null;
    fileInputRef: { current: HTMLInputElement | null };
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownload: (a: { id: string; fileName: string; downloadUrl: string }) => void;
    onDelete: (a: { id: string; fileName: string; downloadUrl: string }) => void;
  }) => (
    <div>
      {error && <div role="alert">{error}</div>}
      <input type="file" ref={fileInputRef} onChange={onFileInputChange} aria-label="Upload file" />
      {attachments.map(a => (
        <div key={a.id}>
          <span>{a.fileName}</span>
          <button type="button" onClick={() => onDownload(a)}>Download {a.fileName}</button>
          <button type="button" onClick={() => onDelete(a)}>Delete {a.fileName}</button>
        </div>
      ))}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Admin Events page', () => {
  let admin: ReturnType<typeof createAdminDsl>;

  beforeEach(() => {
    vi.clearAllMocks();
    reset_default_mocks();
    admin = createAdminDsl();
  });

  describe('Event management', () => {
    it('Given an admin is logged in, when they navigate to the admin page, then they can see the upcoming event admin page', async () => {
      given_an_authenticated_admin_session();
      await admin.navigatesToAdminPage();
      await then_admin_page_is_visible();
    });

    it('Given two events exist, when the admin navigates to the admin page, then both events are listed', async () => {
      given_an_authenticated_admin_session();
      given_events_exist([
        { id: 'evt-1', name: 'Spring Concert', date: '2026-05-15' },
        { id: 'evt-2', name: 'Autumn Showcase', date: '2026-09-20' },
      ]);
      await admin.navigatesToAdminPage();
      await then_events_are_listed(['Spring Concert', 'Autumn Showcase']);
    });

    it('Given the admin is on the events page, when they fill in the event form and submit, then the new event is saved to Firestore', async () => {
      given_an_authenticated_admin_session();
      await admin.navigatesToAdminPage();
      await admin.opensAddEventForm();
      await admin.fillsEventForm({ name: 'Spring Concert', date: '2026-05-15' });
      await admin.submitsEventForm();
      await then_event_was_saved_to_firestore('Spring Concert');
    });

    it('Given there is an existing event, when the admin edits and submits it with a new name, then Firestore is updated with the new data', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15' });
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.changesEventNameTo('Autumn Showcase');
      await admin.submitsEventForm();
      await then_event_was_updated_in_firestore('Autumn Showcase');
    });

    it('Given there is an existing event, when the admin deletes it and confirms, then the event is removed from Firestore', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15' });
      given_delete_confirmed();
      await admin.navigatesToAdminPage();
      await admin.deletesEvent('Spring Concert');
      await then_event_was_deleted_from_firestore();
    });

    it('Given there is a past event and a future event, when the admin navigates to the admin page, then only the future event is listed', async () => {
      given_an_authenticated_admin_session();
      given_a_past_and_future_event_exist(
        { id: 'evt-past', name: 'Summer Gala 2024', date: '2024-07-20' },
        { id: 'evt-future', name: 'Spring Concert', date: '2026-05-15' },
      );
      await admin.navigatesToAdminPage();
      await then_events_are_listed(['Spring Concert']);
      then_event_is_not_listed('Summer Gala 2024');
    });

    it('Given there is a past event and a future event, when the admin enables show historical, then both events are listed', async () => {
      given_an_authenticated_admin_session();
      given_a_past_and_future_event_exist(
        { id: 'evt-past', name: 'Summer Gala 2024', date: '2024-07-20' },
        { id: 'evt-future', name: 'Spring Concert', date: '2026-05-15' },
      );
      await admin.navigatesToAdminPage();
      await admin.togglesShowHistoricalEvents();
      await then_events_are_listed(['Spring Concert', 'Summer Gala 2024']);
    });

    it('Given the admin is on the events page, when they toggle show historical events, then the toggle reflects the new state', async () => {
      given_an_authenticated_admin_session();
      await admin.navigatesToAdminPage();
      await then_admin_page_is_visible();
      then_historical_toggle_is_not_checked();
      await admin.togglesShowHistoricalEvents();
      then_historical_toggle_is_checked();
    });

    it('Given the events database is unavailable, when the admin navigates to the admin page, then an error message is shown', async () => {
      given_an_authenticated_admin_session();
      given_database_is_unavailable();
      await admin.navigatesToAdminPage();
      await then_error_message_is_shown(/failed to connect to database/i);
    });

    it('Given saving a new event fails, when the admin submits the create form, then an error message is shown', async () => {
      given_an_authenticated_admin_session();
      given_firestore_save_fails();
      await admin.navigatesToAdminPage();
      await admin.opensAddEventForm();
      await admin.fillsEventForm({ name: 'Spring Concert', date: '2026-05-15' });
      await admin.submitsEventForm();
      await then_error_message_is_shown(/failed to create event/i);
    });

    it('Given updating an event fails, when the admin submits the edit form, then an error message is shown', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15' });
      given_firestore_update_fails();
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.changesEventNameTo('Autumn Showcase');
      await admin.submitsEventForm();
      await then_error_message_is_shown(/failed to update event/i);
    });

    it('Given deleting an event fails, when the admin confirms deletion, then an alert is shown', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15' });
      given_delete_confirmed();
      given_firestore_delete_fails();
      await admin.navigatesToAdminPage();
      await admin.deletesEvent('Spring Concert');
      await then_delete_alert_was_shown();
    });
  });

  describe('Notice & attachment management', () => {
    it('Given the admin is adding a new event, when they add a notice and submit, then the event is saved with the notice', async () => {
      given_an_authenticated_admin_session();
      await admin.navigatesToAdminPage();
      await admin.opensAddEventForm();
      await admin.fillsEventForm({ name: 'Spring Concert', date: '2026-05-15' });
      await admin.addsNotice('Rehearsal info');
      await admin.submitsEventForm();
      await then_event_was_saved_with_a_notice('Rehearsal info');
    });

    it('Given the admin is editing an event with a notice, when they remove the notice and submit, then the event is updated without notices', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [] }] });
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.removesFirstNotice();
      await admin.submitsEventForm();
      await then_event_was_updated_without_notices();
    });

    it('Given the admin is editing an event with a notice, when they edit the notice text and submit, then the event is updated with the new notice text', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [] }] });
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.editsFirstNoticeText('Updated rehearsal info');
      await admin.submitsEventForm();
      await then_event_was_updated_with_notice_text('Updated rehearsal info');
    });

    it('Given the admin is editing an event with a notice, when they upload a file, then the file is stored in Firebase Storage and the notices are persisted', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [] }] });
      given_file_upload_succeeds();
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.uploadsFile(new File(['content'], 'notice.pdf', { type: 'application/pdf' }));
      await then_file_was_uploaded_to_storage();
      await then_notices_were_persisted();
    });

    it('Given a notice has an attachment, when the admin clicks download, then the attachment is opened in a new tab', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [a_standard_attachment()] }] });
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.downloadsAttachment('notice.pdf');
      then_attachment_was_opened_for_download('https://cdn.example.com/notice.pdf');
    });

    it('Given a notice has an attachment, when the admin deletes it and confirms, then the file is removed from storage and the notices are persisted', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [a_standard_attachment()] }] });
      given_delete_confirmed();
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.deletesAttachment('notice.pdf');
      await then_file_was_deleted_from_storage();
      await then_notices_were_persisted();
    });

    it('Given a file exceeds the size limit, when the admin uploads it, then a validation error is shown and no upload is attempted', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [] }] });
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.uploadsOversizedFile();
      await then_error_message_is_shown(/file size must be less than/i);
      then_no_upload_was_attempted();
    });

    it('Given the admin is editing an event with a notice, when they upload a file with a disallowed type, then a validation error is shown and no upload is attempted', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [] }] });
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.uploadsDisallowedFile();
      await then_error_message_is_shown(/not allowed/i);
      then_no_upload_was_attempted();
    });

    it('Given getting the download URL fails after upload, when the admin uploads a file, then the upload is silently abandoned', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [] }] });
      given_download_url_fails_after_upload();
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.uploadsFile(new File(['content'], 'notice.pdf', { type: 'application/pdf' }));
      await then_upload_was_silently_abandoned();
    });

    it('Given persisting notice attachments fails, when the admin uploads a file, then an error message is shown', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [] }] });
      given_file_upload_succeeds();
      given_firestore_update_fails();
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.uploadsFile(new File(['content'], 'notice.pdf', { type: 'application/pdf' }));
      await then_error_message_is_shown(/failed to save attachment changes/i);
    });

    it('Given deleting an attachment fails, when the admin deletes it and confirms, then an error message is shown', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [a_standard_attachment()] }] });
      given_delete_confirmed();
      given_attachment_delete_fails();
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.deletesAttachment('notice.pdf');
      await then_error_message_is_shown(/delete failed/i);
    });

    it('Given deleting an attachment is unauthorized, when the admin deletes it and confirms, then a permission denied error is shown', async () => {
      given_an_authenticated_admin_session();
      given_an_event_exists({ id: 'evt-1', name: 'Spring Concert', date: '2026-05-15', notices: [{ id: 'notice-1', text: 'Rehearsal info', attachments: [a_standard_attachment()] }] });
      given_delete_confirmed();
      given_attachment_delete_unauthorized();
      await admin.navigatesToAdminPage();
      await admin.opensEditFormFor('Spring Concert');
      await admin.deletesAttachment('notice.pdf');
      await then_error_message_is_shown(/permission denied/i);
    });
  });
});
