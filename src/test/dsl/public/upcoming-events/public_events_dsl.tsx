/**
 * DSL (Layer 2) for Public Events tests.
 *
 * Sits between the test cases (Layer 1) and the protocol driver (Layer 3 — userEvent,
 * screen queries, vi.mocked calls). Test bodies should contain only calls to
 * functions exported from this file.
 *
 * Structure:
 *   given_*   — arrange: configure the backend stubs before rendering
 *   visitor.* — act: drive the UI (created via createPublicEventsDsl())
 *   then_*    — assert: verify observable outcomes
 */

import { expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import App from '../../../../App';
import { make_event_doc } from '../../../utils/make_event_doc';
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

export function reset_default_mocks(): void {
  vi.mocked(onSnapshot).mockImplementation((_query, callback) => {
    if (typeof callback === 'function') (callback as (s: unknown) => void)({ docs: [] });
    return vi.fn();
  });
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    if (typeof callback === 'function') {
      (callback as (user: null) => void)(null);
    }
    return vi.fn();
  });
  vi.spyOn(window, 'open').mockImplementation(() => null);
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

export function given_database_is_unavailable(): void {
  vi.mocked(onSnapshot).mockImplementation((_query, _success, errorCallback) => {
    if (typeof errorCallback === 'function') {
      (errorCallback as (e: Error) => void)(new Error('Database unavailable'));
    }
    return vi.fn();
  });
}

// ---------------------------------------------------------------------------
// Visitor driver — act via the UI
// ---------------------------------------------------------------------------

export function createPublicEventsDsl() {
  const user = userEvent.setup();

  return {
    navigatesToEventsPage: async () => {
      render(<App />);
      // Wait for the page to render — "/" redirects to "/events"
      await screen.findByRole('navigation');
    },

    clicksAttachmentLink: async (fileName: string) => {
      await user.click(await screen.findByText(fileName));
    },
  };
}

// ---------------------------------------------------------------------------
// Then — assert observable outcomes
// ---------------------------------------------------------------------------

export async function then_events_page_is_visible(): Promise<void> {
  await screen.findByTestId('public-events');
}

export async function then_events_are_listed(names: string[]): Promise<void> {
  for (const name of names) {
    expect(await screen.findByText(new RegExp(name))).toBeInTheDocument();
  }
}

export async function then_no_events_message_is_shown(): Promise<void> {
  expect(await screen.findByText(/no upcoming events found/i)).toBeInTheDocument();
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

export async function then_event_has_notices(noticeTexts: string[]): Promise<void> {
  for (const text of noticeTexts) {
    expect(await screen.findByText(text)).toBeInTheDocument();
  }
}

export async function then_attachment_is_shown(fileName: string): Promise<void> {
  expect(await screen.findByText(fileName)).toBeInTheDocument();
}

export function then_attachment_was_opened_for_download(url: string): void {
  expect(window.open).toHaveBeenCalledWith(url, '_blank');
}
