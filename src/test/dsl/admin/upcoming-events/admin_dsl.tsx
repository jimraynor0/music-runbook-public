/**
 * DSL (Layer 2) for Admin Events tests.
 *
 * Sits between the test cases (Layer 1) and the protocol driver (Layer 3 — userEvent,
 * screen queries, vi.mocked calls). Test bodies should contain only calls to
 * functions exported from this file.
 *
 * Structure:
 *   given_*  — arrange: configure the backend stubs before rendering
 *   admin.*  — act: drive the UI (created via createAdminDsl())
 *   then_*   — assert: verify observable outcomes
 */

import { expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDoc, updateDoc, deleteDoc, onSnapshot, collection, doc } from 'firebase/firestore';
import { uploadBytesResumable, getDownloadURL, deleteObject, ref } from 'firebase/storage';
import App from '../../../../App';
import { given_an_admin_logged_in } from '../../../utils/given_an_admin_logged_in';
import { given_existing_admin_users } from '../../../utils/given_existing_admin_users';
import { make_event_doc } from '../../../utils/make_event_doc';
import { MAX_FILE_SIZE } from '../../../../common/services/fileService';
import type { Notice } from '../../../../common/types/events';

// ---------------------------------------------------------------------------
// Shared fixture helpers
// ---------------------------------------------------------------------------

export function a_standard_attachment() {
  return {
    id: '1700000000000',
    fileName: 'notice.pdf',
    fileSize: 1024,
    contentType: 'application/pdf',
    downloadUrl: 'https://cdn.example.com/notice.pdf',
    uploadedAt: '2026-01-01T00:00:00.000Z',
  };
}

// ---------------------------------------------------------------------------
// Given — arrange backend stubs
// ---------------------------------------------------------------------------

export function given_an_authenticated_admin_session(): void {
  given_an_admin_logged_in();
  given_existing_admin_users();
}

export function reset_default_mocks(): void {
  vi.mocked(collection).mockReturnValue('events-collection-ref' as never);
  vi.mocked(doc).mockReturnValue('event-doc-ref' as never);
  vi.mocked(addDoc).mockResolvedValue({ id: 'new-event-id' } as never);
  vi.mocked(updateDoc).mockResolvedValue(undefined);
  vi.mocked(deleteDoc).mockResolvedValue(undefined);
  vi.mocked(deleteObject).mockResolvedValue(undefined);
  vi.mocked(onSnapshot).mockImplementation((_query, callback) => {
    if (typeof callback === 'function') (callback as (s: unknown) => void)({ docs: [] });
    return vi.fn();
  });
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.spyOn(window, 'open').mockImplementation(() => null);
}

export function given_attachment_delete_unauthorized(): void {
  const err = Object.assign(new Error('Permission denied'), { code: 'storage/unauthorized' });
  vi.mocked(deleteObject).mockRejectedValue(err);
}

export function given_an_event_exists(event: {
  id: string;
  name: string;
  date: string;
  notices?: Notice[];
}): void {
  vi.mocked(onSnapshot).mockImplementation((_query, callback) => {
    (callback as (s: unknown) => void)({ docs: [make_event_doc(event)] });
    return vi.fn();
  });
}

export function given_events_exist(events: {
  id: string;
  name: string;
  date: string;
  notices?: Notice[];
}[]): void {
  vi.mocked(onSnapshot).mockImplementation((_query, callback) => {
    (callback as (s: unknown) => void)({ docs: events.map(make_event_doc) });
    return vi.fn();
  });
}

/**
 * Simulates two Firestore query calls that happen when the historical toggle is used:
 *
 * - First call (initial load, showHistorical=false): only the future event is returned,
 *   matching the `where('date', '>=', now)` filter Firestore would apply.
 * - Subsequent calls (after toggle, showHistorical=true): both events are returned,
 *   matching the unfiltered historical query.
 *
 * Tests that only navigate without toggling will only consume the first call.
 */
export function given_a_past_and_future_event_exist(
  pastEvent: { id: string; name: string; date: string },
  futureEvent: { id: string; name: string; date: string },
): void {
  vi.mocked(onSnapshot)
    .mockImplementationOnce((_query, callback) => {
      (callback as (s: unknown) => void)({ docs: [make_event_doc(futureEvent)] });
      return vi.fn();
    })
    .mockImplementation((_query, callback) => {
      (callback as (s: unknown) => void)({ docs: [make_event_doc(pastEvent), make_event_doc(futureEvent)] });
      return vi.fn();
    });
}

export function given_database_is_unavailable(): void {
  vi.mocked(onSnapshot).mockImplementation((_query, _success, errorCallback) => {
    if (typeof errorCallback === 'function') {
      (errorCallback as (e: Error) => void)(new Error('Database unavailable'));
    }
    return vi.fn();
  });
}

export function given_delete_confirmed(): void {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
}

export function given_firestore_save_fails(): void {
  vi.mocked(addDoc).mockRejectedValue(new Error('Network error'));
}

export function given_firestore_update_fails(): void {
  vi.mocked(updateDoc).mockRejectedValue(new Error('Permission denied'));
}

export function given_firestore_delete_fails(): void {
  vi.mocked(deleteDoc).mockRejectedValue(new Error('Permission denied'));
}

export function given_file_upload_succeeds(): void {
  vi.mocked(ref).mockReturnValue('storage-ref' as never);
  vi.mocked(getDownloadURL).mockResolvedValue('https://cdn.example.com/notice.pdf');
  vi.mocked(uploadBytesResumable).mockReturnValue({
    on: (
      _event: string,
      progress: (s: { bytesTransferred: number; totalBytes: number }) => void,
      _error: unknown,
      complete: () => Promise<void>
    ) => {
      progress({ bytesTransferred: 50, totalBytes: 100 });
      complete();
    },
    snapshot: { ref: 'snap-ref' },
  } as never);
}

export function given_download_url_fails_after_upload(): void {
  vi.mocked(ref).mockReturnValue('storage-ref' as never);
  vi.mocked(getDownloadURL).mockRejectedValue(new Error('Download URL unavailable'));
  vi.mocked(uploadBytesResumable).mockReturnValue({
    on: (
      _event: string,
      _progress: unknown,
      _error: unknown,
      complete: () => Promise<void>
    ) => { complete(); },
    snapshot: { ref: 'snap-ref' },
  } as never);
}

export function given_attachment_delete_fails(): void {
  vi.mocked(deleteObject).mockRejectedValue(new Error('Storage error'));
}

// ---------------------------------------------------------------------------
// Admin driver — act via the UI
// ---------------------------------------------------------------------------

export function createAdminDsl() {
  const user = userEvent.setup();

  return {
    navigatesToAdminPage: async () => {
      render(<App />);
      await user.click(screen.getByRole('link', { name: /admin events/i }));
    },

    opensAddEventForm: async () => {
      await user.click(await screen.findByRole('button', { name: /add new event/i }));
    },

    fillsEventForm: async ({ name, date }: { name: string; date: string }) => {
      await user.type(await screen.findByLabelText('Event Name'), name);
      await user.type(screen.getByLabelText('Date'), date);
    },

    submitsEventForm: async () => {
      await user.click(screen.getByRole('button', { name: /create event|update event/i }));
    },

    opensEditFormFor: async (eventName: string) => {
      await user.click(
        await screen.findByRole('button', { name: new RegExp(`edit ${eventName}`, 'i') })
      );
    },

    changesEventNameTo: async (newName: string) => {
      const input = await screen.findByLabelText('Event Name');
      await user.clear(input);
      await user.type(input, newName);
    },

    deletesEvent: async (eventName: string) => {
      await user.click(
        screen.getByRole('button', { name: new RegExp(`delete ${eventName}`, 'i') })
      );
    },

    uploadsFile: async (file: File) => {
      await user.upload(await screen.findByLabelText('Upload file'), file);
    },

    uploadsOversizedFile: async () => {
      const file = new File(['x'], 'big.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1 });
      await user.upload(await screen.findByLabelText('Upload file'), file);
    },

    uploadsDisallowedFile: async () => {
      const file = new File(['content'], 'malware.exe', { type: 'application/x-msdownload' });
      await user.upload(await screen.findByLabelText('Upload file'), file);
    },

    deletesAttachment: async (fileName: string) => {
      await user.click(
        screen.getByRole('button', { name: new RegExp(`delete ${fileName}`, 'i') })
      );
    },

    togglesShowHistoricalEvents: async () => {
      await user.click(screen.getByRole('checkbox', { name: /show historical events/i }));
    },

    addsNotice: async (text: string) => {
      await user.type(await screen.findByLabelText('New notice text'), text);
      await user.click(screen.getByRole('button', { name: /add notice/i }));
    },

    removesFirstNotice: async () => {
      const removeButtons = await screen.findAllByRole('button', { name: /remove notice/i });
      await user.click(removeButtons[0]);
    },

    editsFirstNoticeText: async (text: string) => {
      const inputs = await screen.findAllByLabelText(/notice text/i);
      const noticeTextInput = inputs.find(el => el.getAttribute('aria-label')?.startsWith('Notice text '));
      if (!noticeTextInput) throw new Error('No notice text input found');
      await user.clear(noticeTextInput);
      await user.type(noticeTextInput, text);
    },

    downloadsAttachment: async (fileName: string) => {
      await user.click(
        screen.getByRole('button', { name: new RegExp(`download ${fileName}`, 'i') })
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Then — assert observable outcomes
// ---------------------------------------------------------------------------

export async function then_admin_page_is_visible(): Promise<void> {
  await screen.findByRole('heading', { name: /event administration/i });
}

export async function then_events_are_listed(names: string[]): Promise<void> {
  for (const name of names) {
    expect(await screen.findByText(name)).toBeInTheDocument();
  }
}

export function then_event_is_not_listed(name: string): void {
  expect(screen.queryByText(name)).not.toBeInTheDocument();
}

export async function then_event_was_saved_to_firestore(name: string): Promise<void> {
  await waitFor(() => {
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name })
    );
  });
}

export async function then_event_was_updated_in_firestore(name: string): Promise<void> {
  await waitFor(() => {
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name })
    );
  });
}

export async function then_event_was_deleted_from_firestore(): Promise<void> {
  await waitFor(() => expect(deleteDoc).toHaveBeenCalled());
}

export async function then_file_was_uploaded_to_storage(): Promise<void> {
  await waitFor(() => expect(uploadBytesResumable).toHaveBeenCalled());
}

export async function then_file_was_deleted_from_storage(): Promise<void> {
  await waitFor(() => expect(deleteObject).toHaveBeenCalled());
}

export async function then_notices_were_persisted(): Promise<void> {
  await waitFor(() => {
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ notices: expect.any(Array) })
    );
  });
}

export async function then_error_message_is_shown(pattern: RegExp): Promise<void> {
  await waitFor(() => {
    const alert = screen.queryByRole('alert');
    if (alert) {
      expect(alert).toHaveTextContent(pattern);
    } else {
      expect(screen.getByText(pattern)).toBeInTheDocument();
    }
  });
}

export async function then_delete_alert_was_shown(): Promise<void> {
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith('Failed to delete event');
  });
}

export function then_no_upload_was_attempted(): void {
  expect(uploadBytesResumable).not.toHaveBeenCalled();
}

export async function then_upload_was_silently_abandoned(): Promise<void> {
  await waitFor(() => expect(uploadBytesResumable).toHaveBeenCalled());
  expect(updateDoc).not.toHaveBeenCalled();
}

export function then_historical_toggle_is_checked(): void {
  expect(screen.getByRole('checkbox', { name: /show historical events/i })).toBeChecked();
}

export function then_historical_toggle_is_not_checked(): void {
  expect(screen.getByRole('checkbox', { name: /show historical events/i })).not.toBeChecked();
}

export async function then_event_was_saved_with_a_notice(text: string): Promise<void> {
  await waitFor(() => {
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        notices: expect.arrayContaining([
          expect.objectContaining({ text }),
        ]),
      })
    );
  });
}

export async function then_event_was_updated_without_notices(): Promise<void> {
  await waitFor(() => {
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ notices: [] })
    );
  });
}

export async function then_event_was_updated_with_notice_text(text: string): Promise<void> {
  await waitFor(() => {
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        notices: expect.arrayContaining([
          expect.objectContaining({ text }),
        ]),
      })
    );
  });
}

export function then_attachment_was_opened_for_download(url: string): void {
  expect(window.open).toHaveBeenCalledWith(url, '_blank');
}
