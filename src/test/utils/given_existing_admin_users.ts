import { vi } from 'vitest';
import { getDocs } from 'firebase/firestore';

/**
 * Mocks the Firestore 'staffs' collection to contain an authorised staff member.
 *
 * Call this in beforeEach (or at the top of a test) when the scenario requires
 * a staff record to exist in the database.
 *
 * Pair with given_an_admin_logged_in() to fully simulate an authenticated admin session.
 */
export function given_existing_admin_users(email = 'staff@school.edu') {
  vi.mocked(getDocs).mockResolvedValue({
    empty: false,
    docs: [{ id: 'staff-1', data: () => ({ email }) }],
  } as never);
}
