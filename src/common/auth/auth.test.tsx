import { beforeEach, describe, it, vi } from 'vitest';
import {
  createAuthDsl,
  given_an_authenticated_admin_session,
  given_auth_is_loading,
  given_no_user_is_logged_in,
  given_sign_in_fails,
  given_sign_in_fails_with_unknown_error,
  given_sign_in_succeeds,
  given_user_is_not_authorized,
  reset_default_mocks,
  then_admin_page_is_visible,
  then_error_message_is_shown,
  then_info_message_is_shown,
  then_loading_spinner_is_shown,
  then_login_page_is_shown,
  then_admin_page_is_not_visible,
  then_sign_in_button_is_visible,
  then_sign_in_was_attempted,
} from '../../test/dsl/auth/auth_dsl';

// ---------------------------------------------------------------------------
// Dumb/presentation component stubs (vi.mock is hoisted — must live here)
// ---------------------------------------------------------------------------

vi.mock('./components/LoginPageView', () => ({
  default: ({
    loading,
    error,
    onSignIn,
  }: {
    loading: boolean;
    error: string | null;
    onSignIn: () => void;
  }) => (
    <div>
      <h4>Staff Login</h4>
      {error && <div role="alert">{error}</div>}
      <div role="alert">
        <small>
          <strong>Note:</strong> Only pre-authorized staff accounts can access this system.
          Contact your administrator if you need access.
        </small>
      </div>
      <button onClick={onSignIn} disabled={loading}>
        Sign in with Google
      </button>
    </div>
  ),
}));

vi.mock('./components/ProtectedRouteView', () => ({
  default: ({
    loading,
    authenticated,
    children,
    renderLogin,
  }: {
    loading: boolean;
    authenticated: boolean;
    children: React.ReactNode;
    renderLogin: () => React.ReactNode;
  }) => {
    if (loading) {
      return (
        <div role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      );
    }
    if (!authenticated) {
      return <>{renderLogin()}</>;
    }
    return <>{children}</>;
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth flow', () => {
  let user: ReturnType<typeof createAuthDsl>;

  beforeEach(() => {
    vi.clearAllMocks();
    reset_default_mocks();
    user = createAuthDsl();
  });

  describe('Login page', () => {
    it('Given no user is logged in, when they navigate to the admin page, then the login page is shown', async () => {
      given_no_user_is_logged_in();
      await user.navigatesToAdminPage();
      await then_login_page_is_shown();
    });

    it('Given no user is logged in, when they click sign in, then a sign in attempt is made', async () => {
      given_no_user_is_logged_in();
      given_sign_in_succeeds();
      await user.navigatesToAdminPage();
      await user.clicksSignIn();
      await then_sign_in_was_attempted();
    });

    it('Given sign in fails, when the user clicks sign in, then an error message is shown', async () => {
      given_no_user_is_logged_in();
      given_sign_in_fails('Google sign-in was cancelled');
      await user.navigatesToAdminPage();
      await user.clicksSignIn();
      await then_error_message_is_shown(/google sign-in was cancelled/i);
    });

    it('Given sign in fails with an unknown error, when the user clicks sign in, then a generic error message is shown', async () => {
      given_no_user_is_logged_in();
      given_sign_in_fails_with_unknown_error();
      await user.navigatesToAdminPage();
      await user.clicksSignIn();
      await then_error_message_is_shown(/unknown error occurred/i);
    });
  });

  describe('Protected route', () => {
    it('Given auth is loading, when navigating to the admin page, then a loading spinner is shown', async () => {
      given_auth_is_loading();
      await user.navigatesToAdminPage();
      then_loading_spinner_is_shown();
    });

    it('Given an authorized user is logged in, when they navigate to the admin page, then the admin page is visible', async () => {
      given_an_authenticated_admin_session();
      await user.navigatesToAdminPage();
      await then_admin_page_is_visible();
    });

    it('Given a user is not authorized, when they log in, then the admin page is not visible', async () => {
      given_user_is_not_authorized();
      await user.navigatesToAdminPage();
      await then_admin_page_is_not_visible();
    });
  });
});
