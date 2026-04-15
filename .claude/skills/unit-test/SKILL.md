---
description: Write unit tests for the SPA using Vitest and React Testing Library, following the Detroit (classicist) style.
---

# Unit Test Skill

Write integration tests for the SPA using Vitest and React Testing Library, following the Detroit (classicist) style.

## Hard Constraints

1. **Never modify production code.** If a test cannot pass without changing production code, stop and report the issue instead.
2. **Test the SPA as a whole.** Render `<App />` (or the largest meaningful subtree for the scenario) and exercise real user flows. Do not render a single component in isolation unless it is the root component.
3. **Drive tests through UI events only.** Use `userEvent` to click, type, and interact. Do not call service functions or hook internals directly.
4. **Only mock dumb/presentation components and backend (Firebase SDK) calls.** Do not mock service modules (`eventService`, `fileService`, `emailService`, etc.), hooks, or container components — let those run for real.
5. **Write test descriptions in Given-When-Then format.** Verbose names are fine and preferred.
6. **Test bodies must contain only DSL calls.** No `vi.mocked`, `screen`, `userEvent`, `waitFor`, or `render` calls in test bodies. All system interaction is hidden behind the DSL layer.
7. **No `given_*` calls in `beforeEach`.** Putting a `given_*` call in `beforeEach` makes each test's preconditions incomplete — a reader must look in two places to understand the full setup. Every `given_*` call belongs in the test body. Only `vi.clearAllMocks()`, `reset_default_mocks()`, and DSL factory construction (e.g. `admin = createAdminDsl()`) belong in `beforeEach`.

## Reference Implementation

The canonical example for this pattern is the admin events feature:

- **Test file**: `src/upcoming-events/admin/adminEvents.test.tsx`
- **DSL file**: `src/test/dsl/upcoming-events/admin_dsl.tsx`

Read both files before writing tests for a new feature.

## Architecture: Dave Farley's 4-Layer Pattern

Tests follow the 4-layer acceptance test architecture applied at the unit level:

```
Layer 1: Test cases          — Given/When/Then, calls DSL verbs only
Layer 2: DSL                 — Domain-language functions (given_*, admin.*, then_*)
Layer 3: Protocol drivers    — vi.mocked(), screen, userEvent, waitFor, render
Layer 4: SUT                 — The React application
```

### Layer 1 — Test cases (in the `.test.tsx` file)

Test bodies read as pure domain language. No testing-library or vitest internals. See `src/upcoming-events/admin/adminEvents.test.tsx` for the full example.

### Layer 2 — DSL file

Create a DSL file at `src/test/dsl/<feature>/` containing three kinds of exports:

- **`given_*` functions** — set up preconditions by configuring mocks
- **`createXxxDsl()` factory** — returns an object of `async` action methods wrapping `userEvent` + `screen`
- **`then_*` functions** — make assertions using `screen` + `waitFor` + `expect`
- **`reset_default_mocks()`** — restores mock implementations after `vi.clearAllMocks()` clears them

See `src/test/dsl/upcoming-events/admin_dsl.tsx` for the full example of all four.

### Layer 3 — Protocol drivers (stay in DSL and test file setup)

- `vi.mock()` for component stubs **must remain in the `.test.tsx` file** because Vitest hoists them at module level — they cannot be moved to the DSL file.
- Everything else (`vi.mocked()`, `screen`, `userEvent`, `waitFor`, `render`) lives in the DSL file.

### `beforeEach` pattern

`beforeEach` contains only: `vi.clearAllMocks()`, `reset_default_mocks()`, and DSL factory construction. No `given_*` calls. Every precondition goes in the test body so each test is self-contained.

See `src/upcoming-events/admin/adminEvents.test.tsx` for the full example.

## Setup Requirements

Ensure the following dev dependencies are installed. If not, install them first:

```bash
yarn add -D vitest @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event jsdom
```

Ensure `vite.config.ts` includes the test configuration:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // ... existing config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
```

Ensure `src/setupTests.ts` exists with:

```typescript
import '@testing-library/jest-dom';
```

Ensure `package.json` has the test scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## Test File Placement

Place the test file next to the feature's entry point, named after the user flow being tested:

- `src/upcoming-events/upcomingEvents.test.tsx` for public events flows
- `src/upcoming-events/admin/adminEvents.test.tsx` for admin event management flows

Place the DSL file at:

- `src/test/dsl/<feature>/` for the feature's DSL

## Test Utilities

Global test utilities live in `src/test/utils/`. **Before writing any test helpers from scratch, check there first.**

| Utility | File | What it does |
|---|---|---|
| `make_event_doc` | `src/test/utils/make_event_doc.ts` | Builds a mock Firestore document in the shape `useEvents` expects from `onSnapshot` |
| `given_an_admin_logged_in` | `src/test/utils/given_an_admin_logged_in.ts` | Mocks `onAuthStateChanged` to fire immediately with an authenticated user |
| `given_existing_admin_users` | `src/test/utils/given_existing_admin_users.ts` | Mocks the `staffs` Firestore query to return an authorised staff record |

## What to Mock

### Backend: Firebase SDK only

Mock the Firebase SDK modules directly (`firebase/firestore`, `firebase/auth`, `firebase/storage`, and the local `config`). Do **not** mock service modules.

See `src/upcoming-events/admin/adminEvents.test.tsx` for the `vi.mock` blocks.

### Dumb/presentation components

Dumb/presentation components (files under `components/`) are **not** covered by these integration tests — they are mocked out to keep tests focused on user flows. Their visual correctness is instead covered by Playwright component tests (`playwright-ct`), which mount each component in isolation and snapshot every relevant prop combination.

Mock them as stubs that wire up all the props needed to exercise the container logic. Every callback prop that the container passes down must be wired to a UI element in the stub — otherwise the container's handler will never be called and coverage will have gaps.

See `src/upcoming-events/admin/adminEvents.test.tsx` for the stub examples.

## Coverage Goals

Aim for **near 100% line and function coverage** on container components and service modules. After writing the initial test suite, run coverage and check for gaps:

```bash
yarn test --coverage
```

### Acceptable coverage gaps (do not attempt to cover)

| Gap | Reason |
|---|---|
| Files under `components/` | Mocked out by design; covered by `playwright-ct` |
| Internal functions of mocked components | Testing the mock, not the SUT |
| Framework/infrastructure helpers that are purely called by mocked code (e.g. `getFileIcon` inside a mocked view component) | Unreachable via real UI interaction |

### How to close coverage gaps

When a container function shows 0% coverage, the usual cause is that the mock stub does not wire up the corresponding callback prop. Fix by:

1. Identifying which prop callback triggers the uncovered handler (e.g. `onRemoveNotice` → `handleRemoveNotice`)
2. Adding a UI element to the mock stub that calls it (e.g. a "Remove Notice" button per notice)
3. Adding a DSL action that interacts with that element (e.g. `admin.removesFirstNotice()`)
4. Adding a `then_*` assertion that verifies the expected side-effect (e.g. `then_event_was_updated_without_notices()`)
5. Writing a new Given-When-Then test that exercises the full flow

## Running Tests

After writing the test file, run:

```bash
yarn test
```

If a test fails because production code would need to change, **stop and report** — do not patch production code to make the test pass.
