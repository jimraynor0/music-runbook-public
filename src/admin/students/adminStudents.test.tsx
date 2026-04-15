import { beforeEach, describe, it, vi } from 'vitest';
import {
  createStudentsAdminDsl,
  given_an_authenticated_admin_session,
  given_groups_exist,
  given_no_groups_exist,
  given_batch_commit_fails,
  reset_default_mocks,
  then_students_page_is_visible,
  then_preview_shows_students,
  then_import_succeeded,
  then_batch_was_committed,
  then_error_message_is_shown,
  then_no_groups_warning_is_shown,
  then_preview_is_not_visible,
} from '../../test/dsl/admin/students/admin_dsl';

// ---------------------------------------------------------------------------
// Stub the view component
// ---------------------------------------------------------------------------

vi.mock('./components/AdminStudentsPageView', () => ({
  default: ({
    groups,
    groupsLoading,
    csvRows,
    parseError,
    importError,
    importResult,
    importing,
    onFileSelected,
    onImport,
    onReset,
  }: {
    groups: { id: string; name: string }[];
    groupsLoading: boolean;
    csvRows: { firstName: string; lastName?: string; group: string }[] | null;
    parseError: string | null;
    importError: string | null;
    importResult: { studentsImported: number; familiesCreated: number } | null;
    importing: boolean;
    onFileSelected: (file: File) => void;
    onImport: () => void;
    onReset: () => void;
  }) => {
    if (groupsLoading) return <div>Loading...</div>;
    return (
      <div>
        <h1>Student Import</h1>
        {groups.length === 0 && <div role="alert">No groups exist yet. Please create groups before importing students.</div>}
        {parseError && <div role="alert">{parseError}</div>}
        {importError && <div role="alert">{importError}</div>}
        {importResult && (
          <div role="alert">
            Successfully imported {importResult.studentsImported} students
            in {importResult.familiesCreated} families.
          </div>
        )}
        <input
          type="file"
          aria-label="Upload CSV"
          onChange={(e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) onFileSelected(file);
          }}
        />
        {csvRows && csvRows.length > 0 && (
          <div>
            <h5>Preview ({csvRows.length} students)</h5>
            <table>
              <tbody>
                {csvRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.firstName}</td>
                    <td>{row.lastName || ''}</td>
                    <td>{row.group}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={onImport} disabled={importing}>Import Students</button>
            <button onClick={onReset}>Cancel</button>
          </div>
        )}
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Admin Students page', () => {
  let admin: ReturnType<typeof createStudentsAdminDsl>;

  beforeEach(() => {
    vi.clearAllMocks();
    reset_default_mocks();
    admin = createStudentsAdminDsl();
  });

  it('Given an admin is logged in, when they navigate to the students page, then they can see the student import page', async () => {
    given_an_authenticated_admin_session();
    await admin.navigatesToStudentsAdminPage();
    await then_students_page_is_visible();
  });

  it('Given no groups exist, when the admin navigates to the students page, then a warning is shown', async () => {
    given_an_authenticated_admin_session();
    given_no_groups_exist();
    await admin.navigatesToStudentsAdminPage();
    await then_no_groups_warning_is_shown();
  });

  it('Given a valid CSV is uploaded, when the admin selects the file, then a preview is shown', async () => {
    given_an_authenticated_admin_session();
    await admin.navigatesToStudentsAdminPage();
    await admin.uploadsCsvFile('First Name,Last Name,Group\nAlice,Tan,Training Band\nBob,Lim,Training Band');
    await then_preview_shows_students(2);
  });

  it('Given a CSV with an invalid group, when the admin clicks import, then an error is shown', async () => {
    given_an_authenticated_admin_session();
    given_groups_exist([{ id: 'g1', name: 'Training Band' }]);
    await admin.navigatesToStudentsAdminPage();
    await admin.uploadsCsvFile('First Name,Last Name,Group\nAlice,Tan,Nonexistent Band');
    await admin.clicksImport();
    await then_error_message_is_shown(/unknown groups/i);
  });

  it('Given a valid CSV, when the admin clicks import, then students are imported successfully', async () => {
    given_an_authenticated_admin_session();
    given_groups_exist([{ id: 'g1', name: 'Training Band' }]);
    await admin.navigatesToStudentsAdminPage();
    await admin.uploadsCsvFile('First Name,Last Name,Group\nAlice,Tan,Training Band\nBob,Tan,Training Band');
    await admin.clicksImport();
    await then_import_succeeded(2, 1);
    await then_batch_was_committed();
  });

  it('Given the batch commit fails, when the admin clicks import, then an error is shown', async () => {
    given_an_authenticated_admin_session();
    given_groups_exist([{ id: 'g1', name: 'Training Band' }]);
    given_batch_commit_fails();
    await admin.navigatesToStudentsAdminPage();
    await admin.uploadsCsvFile('First Name,Last Name,Group\nAlice,Tan,Training Band');
    await admin.clicksImport();
    await then_error_message_is_shown(/failed to import students/i);
  });

  it('Given an invalid CSV is uploaded, when the admin selects the file, then a parse error is shown', async () => {
    given_an_authenticated_admin_session();
    await admin.navigatesToStudentsAdminPage();
    await admin.uploadsCsvFile('Wrong,Headers\nfoo,bar');
    await then_error_message_is_shown(/must have a "first name" column/i);
  });

  it('Given a CSV is previewed, when the admin clicks cancel, then the preview is cleared', async () => {
    given_an_authenticated_admin_session();
    await admin.navigatesToStudentsAdminPage();
    await admin.uploadsCsvFile('First Name,Last Name,Group\nAlice,Tan,Training Band');
    await then_preview_shows_students(1);
    await admin.clicksCancel();
    then_preview_is_not_visible();
  });
});
