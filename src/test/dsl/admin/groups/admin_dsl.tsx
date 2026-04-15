/**
 * DSL (Layer 2) for Admin Groups tests.
 *
 * Structure:
 *   given_*  — arrange: configure the backend stubs before rendering
 *   admin.*  — act: drive the UI (created via createGroupsAdminDsl())
 *   then_*   — assert: verify observable outcomes
 */

import { expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDoc, updateDoc, deleteDoc, getDocs, collection, doc } from 'firebase/firestore';
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

export function reset_default_mocks(): void {
  vi.mocked(collection).mockReturnValue('groups-collection-ref' as never);
  vi.mocked(doc).mockReturnValue('group-doc-ref' as never);
  vi.mocked(addDoc).mockResolvedValue({ id: 'new-group-id' } as never);
  vi.mocked(updateDoc).mockResolvedValue(undefined);
  vi.mocked(deleteDoc).mockResolvedValue(undefined);
  // Default: getDocs returns staff auth (first call) then empty groups (subsequent calls)
  setupGetDocsMock([]);
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  vi.spyOn(window, 'alert').mockImplementation(() => {});
}

function makeGroupDoc(group: { id: string; name: string }) {
  return {
    id: group.id,
    ref: { id: group.id },
    data: () => ({ name: group.name }),
  };
}

/**
 * Sets up getDocs to handle both the staff auth check (first call)
 * and groups fetch (subsequent calls).
 */
function setupGetDocsMock(groups: { id: string; name: string }[]) {
  const groupDocs = groups.map(makeGroupDoc);
  let callCount = 0;
  vi.mocked(getDocs).mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // First call is the staff auth check
      return Promise.resolve({
        empty: false,
        docs: [{ id: 'staff-1', data: () => ({ email: 'staff@school.edu' }) }],
      } as never);
    }
    // Subsequent calls are groups fetch
    return Promise.resolve({
      empty: groupDocs.length === 0,
      docs: groupDocs,
    } as never);
  });
}

export function given_groups_exist(groups: { id: string; name: string }[]): void {
  setupGetDocsMock(groups);
}

export function given_no_groups_exist(): void {
  setupGetDocsMock([]);
}

export function given_firestore_add_fails(): void {
  vi.mocked(addDoc).mockRejectedValue(new Error('Firestore add failed'));
}

export function given_firestore_update_fails(): void {
  vi.mocked(updateDoc).mockRejectedValue(new Error('Firestore update failed'));
}

export function given_firestore_delete_fails(): void {
  vi.mocked(deleteDoc).mockRejectedValue(new Error('Firestore delete failed'));
}

export function given_delete_confirmed(): void {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
}

export function given_groups_fetch_fails(): void {
  let callCount = 0;
  vi.mocked(getDocs).mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve({
        empty: false,
        docs: [{ id: 'staff-1', data: () => ({ email: 'staff@school.edu' }) }],
      } as never);
    }
    return Promise.reject(new Error('Firestore unavailable'));
  });
}

// ---------------------------------------------------------------------------
// User driver — act via the UI
// ---------------------------------------------------------------------------

export function createGroupsAdminDsl() {
  const user = userEvent.setup();

  return {
    navigatesToGroupsAdminPage: async () => {
      render(<App />);
      await user.click(screen.getByRole('link', { name: /admin groups/i }));
    },

    typesNewGroupName: async (name: string) => {
      const input = await screen.findByLabelText(/new group name/i);
      await user.clear(input);
      await user.type(input, name);
    },

    clicksAddGroup: async () => {
      await user.click(screen.getByRole('button', { name: /add group/i }));
    },

    clicksEditFor: async (groupName: string) => {
      const row = (await screen.findByText(groupName)).closest('tr')!;
      const editBtn = row.querySelector('button')!;
      await user.click(editBtn);
    },

    typesEditName: async (name: string) => {
      const input = await screen.findByLabelText(/edit group name/i);
      await user.clear(input);
      await user.type(input, name);
    },

    clicksSaveEdit: async () => {
      await user.click(screen.getByRole('button', { name: /save/i }));
    },

    clicksCancelEdit: async () => {
      await user.click(screen.getByRole('button', { name: /cancel/i }));
    },

    clicksDeleteFor: async (groupName: string) => {
      const row = (await screen.findByText(groupName)).closest('tr')!;
      const buttons = row.querySelectorAll('button');
      const deleteBtn = buttons[1]; // second button is delete
      await user.click(deleteBtn);
    },
  };
}

// ---------------------------------------------------------------------------
// Then — assert observable outcomes
// ---------------------------------------------------------------------------

export async function then_groups_page_is_visible(): Promise<void> {
  expect(await screen.findByRole('heading', { name: /group administration/i })).toBeInTheDocument();
}

export async function then_groups_are_listed(names: string[]): Promise<void> {
  for (const name of names) {
    expect(await screen.findByText(name)).toBeInTheDocument();
  }
}

export async function then_group_was_created(name: string): Promise<void> {
  await waitFor(() => {
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name }),
    );
  });
}

export async function then_group_was_updated(name: string): Promise<void> {
  await waitFor(() => {
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name }),
    );
  });
}

export async function then_group_was_deleted(): Promise<void> {
  await waitFor(() => {
    expect(deleteDoc).toHaveBeenCalled();
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

export function then_no_empty_state_message(): void {
  expect(screen.queryByText(/no groups yet/i)).not.toBeInTheDocument();
}

export async function then_empty_state_is_shown(): Promise<void> {
  expect(await screen.findByText(/no groups yet/i)).toBeInTheDocument();
}
