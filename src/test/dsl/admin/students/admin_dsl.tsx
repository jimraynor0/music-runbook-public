/**
 * DSL (Layer 2) for Admin Students tests.
 *
 * Structure:
 *   given_*  — arrange: configure the backend stubs before rendering
 *   admin.*  — act: drive the UI (created via createStudentsAdminDsl())
 *   then_*   — assert: verify observable outcomes
 */

import { expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocs, writeBatch } from 'firebase/firestore';
import App from '../../../../App';
import { given_an_admin_logged_in } from '../../../utils/given_an_admin_logged_in';
import { given_existing_admin_users } from '../../../utils/given_existing_admin_users';

// ---------------------------------------------------------------------------
// Given — arrange backend stubs
// ---------------------------------------------------------------------------

export function given_an_authenticated_admin_session(): void {
  given_an_admin_logged_in();
  given_existing_admin_users();
}

function makeGroupDoc(group: { id: string; name: string }) {
  return {
    id: group.id,
    ref: { id: group.id },
    data: () => ({ name: group.name }),
  };
}

export function reset_default_mocks(): void {
  // Default: getDocs returns staff auth (1st), then groups (2nd), then empty students/families for batch deletes
  setupGetDocsMock([{ id: 'g1', name: 'Training Band' }]);
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  vi.spyOn(window, 'alert').mockImplementation(() => {});

  const mockBatch = {
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };
  vi.mocked(writeBatch).mockReturnValue(mockBatch as never);
}

function setupGetDocsMock(groups: { id: string; name: string }[]) {
  const groupDocs = groups.map(makeGroupDoc);
  let callCount = 0;
  vi.mocked(getDocs).mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // Staff auth check
      return Promise.resolve({
        empty: false,
        docs: [{ id: 'staff-1', data: () => ({ email: 'staff@school.edu' }) }],
      } as never);
    }
    if (callCount === 2) {
      // Groups fetch
      return Promise.resolve({
        empty: groupDocs.length === 0,
        docs: groupDocs,
      } as never);
    }
    // Subsequent calls: existing students/families for deletion (empty)
    return Promise.resolve({
      empty: true,
      docs: [],
    } as never);
  });
}

export function given_groups_exist(groups: { id: string; name: string }[]): void {
  setupGetDocsMock(groups);
}

export function given_no_groups_exist(): void {
  setupGetDocsMock([]);
}

export function given_batch_commit_fails(): void {
  const mockBatch = {
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockRejectedValue(new Error('Batch commit failed')),
  };
  vi.mocked(writeBatch).mockReturnValue(mockBatch as never);
}

// ---------------------------------------------------------------------------
// User driver — act via the UI
// ---------------------------------------------------------------------------

function createCsvFile(content: string): File {
  return new File([content], 'students.csv', { type: 'text/csv' });
}

export function createStudentsAdminDsl() {
  const user = userEvent.setup();

  return {
    navigatesToStudentsAdminPage: async () => {
      render(<App />);
      await user.click(screen.getByRole('link', { name: /admin students/i }));
    },

    uploadsCsvFile: async (csvContent: string) => {
      const fileInput = await screen.findByLabelText(/upload csv/i);
      const file = createCsvFile(csvContent);
      await user.upload(fileInput, file);
    },

    clicksImport: async () => {
      const btn = await screen.findByRole('button', { name: /import students/i });
      await user.click(btn);
    },

    clicksCancel: async () => {
      await user.click(screen.getByRole('button', { name: /cancel/i }));
    },
  };
}

// ---------------------------------------------------------------------------
// Then — assert observable outcomes
// ---------------------------------------------------------------------------

export async function then_students_page_is_visible(): Promise<void> {
  expect(await screen.findByRole('heading', { name: /student import/i })).toBeInTheDocument();
}

export async function then_preview_shows_students(count: number): Promise<void> {
  expect(await screen.findByText(new RegExp(`preview \\(${count} students\\)`, 'i'))).toBeInTheDocument();
}

export async function then_import_succeeded(studentCount: number, familyCount: number): Promise<void> {
  await waitFor(() => {
    expect(screen.getByText(new RegExp(`${studentCount} students`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${familyCount} families`))).toBeInTheDocument();
  });
}

export async function then_batch_was_committed(): Promise<void> {
  await waitFor(() => {
    const batch = vi.mocked(writeBatch).mock.results[0]?.value;
    expect(batch.commit).toHaveBeenCalled();
  });
}

export async function then_error_message_is_shown(pattern: RegExp): Promise<void> {
  await waitFor(() => {
    const alerts = screen.queryAllByRole('alert');
    const match = alerts.find(a => a.textContent?.match(pattern));
    if (match) {
      expect(match).toHaveTextContent(pattern);
    } else {
      expect(screen.getByText(pattern)).toBeInTheDocument();
    }
  });
}

export async function then_no_groups_warning_is_shown(): Promise<void> {
  expect(await screen.findByText(/no groups exist yet/i)).toBeInTheDocument();
}

export function then_preview_is_not_visible(): void {
  expect(screen.queryByText(/preview/i)).not.toBeInTheDocument();
}
