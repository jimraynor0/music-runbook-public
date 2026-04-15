/**
 * DSL (Layer 2) for Auth tests.
 *
 * Sits between the test cases (Layer 1) and the protocol driver (Layer 3 — userEvent,
 * screen queries, vi.mocked calls). Test bodies should contain only calls to
 * functions exported from this file.
 *
 * Structure:
 *   given_*  — arrange: configure the backend stubs before rendering
 *   user.*   — act: drive the UI (created via createAuthDsl())
 *   then_*   — assert: verify observable outcomes
 */

import { expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDocs } from 'firebase/firestore';
import App from '../../../App';
import { given_an_admin_logged_in } from '../../utils/given_an_admin_logged_in';
import { given_existing_admin_users } from '../../utils/given_existing_admin_users';
import type { User } from 'firebase/auth';

// ---------------------------------------------------------------------------
// Given — arrange backend stubs
// ---------------------------------------------------------------------------

export function reset_default_mocks(): void {
  vi.mocked(signInWithPopup).mockResolvedValue({
    user: { uid: 'test-uid', email: 'staff@school.edu' },
  } as never);
  vi.mocked(signOut).mockResolvedValue(undefined);
  vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as never);
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    if (typeof callback === 'function') {
      callback(null);
    }
    return vi.fn();
  });
}

export function given_no_user_is_logged_in(): void {
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    if (typeof callback === 'function') {
      callback(null);
    }
    return vi.fn();
  });
}

export function given_an_authenticated_admin_session(): void {
  given_an_admin_logged_in();
  given_existing_admin_users();
}

export function given_user_is_not_authorized(): void {
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    if (typeof callback === 'function') {
      callback({ uid: 'test-uid', email: 'unauthorized@school.edu' } as User);
    }
    return vi.fn();
  });
  vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as never);
}

export function given_sign_in_succeeds(): void {
  vi.mocked(signInWithPopup).mockResolvedValue({
    user: { uid: 'test-uid', email: 'staff@school.edu' },
  } as never);
}

export function given_sign_in_fails(message: string): void {
  vi.mocked(signInWithPopup).mockRejectedValue(new Error(message));
}

export function given_sign_in_fails_with_unknown_error(): void {
  vi.mocked(signInWithPopup).mockRejectedValue('unexpected error');
}

export function given_auth_is_loading(): void {
  vi.mocked(onAuthStateChanged).mockImplementation(() => {
    // Never call the callback — auth stays in loading state
    return vi.fn();
  });
}

// ---------------------------------------------------------------------------
// User driver — act via the UI
// ---------------------------------------------------------------------------

export function createAuthDsl() {
  const user = userEvent.setup();

  return {
    navigatesToAdminPage: async () => {
      render(<App />);
      await user.click(screen.getByRole('link', { name: /admin events/i }));
    },

    clicksSignIn: async () => {
      await user.click(await screen.findByRole('button', { name: /sign in with google/i }));
    },
  };
}

// ---------------------------------------------------------------------------
// Then — assert observable outcomes
// ---------------------------------------------------------------------------

export async function then_login_page_is_shown(): Promise<void> {
  expect(await screen.findByRole('heading', { name: /staff login/i })).toBeInTheDocument();
}

export async function then_sign_in_button_is_visible(): Promise<void> {
  expect(await screen.findByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
}

export function then_loading_spinner_is_shown(): void {
  expect(screen.getByRole('status')).toBeInTheDocument();
}

export async function then_admin_page_is_visible(): Promise<void> {
  await screen.findByRole('heading', { name: /event administration/i });
}

export async function then_admin_page_is_not_visible(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('heading', { name: /event administration/i })).not.toBeInTheDocument();
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

export async function then_user_was_signed_out(): Promise<void> {
  await waitFor(() => {
    expect(signOut).toHaveBeenCalled();
  });
}

export async function then_sign_in_was_attempted(): Promise<void> {
  await waitFor(() => {
    expect(signInWithPopup).toHaveBeenCalled();
  });
}

export function then_info_message_is_shown(pattern: RegExp): void {
  const alerts = screen.getAllByRole('alert');
  const infoAlert = alerts.find(a => a.textContent?.match(pattern));
  expect(infoAlert).toBeTruthy();
}
