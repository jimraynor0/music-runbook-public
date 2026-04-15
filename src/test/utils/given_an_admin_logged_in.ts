import { vi } from 'vitest';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

/**
 * Mocks Firebase Auth to immediately fire onAuthStateChanged with a logged-in user.
 *
 * Call this in beforeEach (or at the top of a test) when the scenario requires
 * the user to already be authenticated.
 *
 * Pair with given_existing_admin_users() so the subsequent staff authorisation
 * check in AuthContext also passes.
 */
export function given_an_admin_logged_in(email = 'staff@school.edu') {
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    if (typeof callback === 'function') {
      callback({ uid: 'test-uid', email } as User);
    }
    return vi.fn(); // unsubscribe noop
  });
}
