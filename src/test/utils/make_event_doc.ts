import type { Notice } from '../../common/types/events';

interface EventDocInput {
  id: string;
  name: string;
  date: string; // plain ISO or date string — converted to Timestamp shape internally
  notices?: Notice[];
}

/**
 * Creates a mock Firestore document for an event, with the correct shape that
 * useEvents expects from onSnapshot.
 *
 * Wraps the date string in a { toDate() } object so the useEvents mapping
 * (firebaseEvent.date.toDate().toISOString()) works without error.
 *
 * Usage:
 *   vi.mocked(onSnapshot).mockImplementation((_query, callback) => {
 *     callback({ docs: [make_event_doc({ id: '1', name: 'Spring Concert', date: '2026-05-15' })] });
 *     return vi.fn();
 *   });
 */
export function make_event_doc({ id, name, date, notices = [] }: EventDocInput) {
  return {
    id,
    data: () => ({
      name,
      date: { toDate: () => new Date(date) },
      notices,
    }),
  };
}
