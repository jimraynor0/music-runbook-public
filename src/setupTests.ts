// Extends Vitest's `expect` with DOM-specific matchers from @testing-library/jest-dom
// (e.g. toBeInTheDocument, toHaveTextContent, toBeVisible, toBeDisabled).
// Runs before every test file via `setupFiles` in vitest.config.ts.
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Global backend mocks — applied to every test file automatically.
// Use mockBackend() in beforeEach to configure runtime behaviour and overrides.
// ---------------------------------------------------------------------------

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'new-event-id' }),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDocs: vi.fn(),
  doc: vi.fn().mockReturnValue({ id: 'mock-doc-id' }),
  writeBatch: vi.fn().mockReturnValue({
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  }),
  onSnapshot: vi.fn().mockImplementation((_query, callback) => {
    if (typeof callback === 'function') callback({ docs: [] } as never);
    return vi.fn();
  }),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((d) => ({ toDate: () => d })),
  },
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock('./common/firebase/config', () => ({
  db: {},
  storage: {},
  auth: {},
}));
