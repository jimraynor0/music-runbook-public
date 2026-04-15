import { beforeEach, describe, it, vi } from 'vitest';
import {
  createGroupsAdminDsl,
  given_an_authenticated_admin_session,
  given_groups_exist,
  given_no_groups_exist,
  given_firestore_add_fails,
  given_firestore_update_fails,
  given_firestore_delete_fails,
  given_delete_confirmed,
  given_groups_fetch_fails,
  reset_default_mocks,
  then_groups_page_is_visible,
  then_groups_are_listed,
  then_group_was_created,
  then_group_was_updated,
  then_group_was_deleted,
  then_error_message_is_shown,
  then_empty_state_is_shown,
} from '../../test/dsl/admin/groups/admin_dsl';

// ---------------------------------------------------------------------------
// Stub the view component so tests focus on the controller logic
// ---------------------------------------------------------------------------

vi.mock('./components/AdminGroupsPageView', () => ({
  default: ({
    groups,
    loading,
    error,
    newGroupName,
    editingGroup,
    editName,
    onNewGroupNameChange,
    onAddGroup,
    onStartEdit,
    onEditNameChange,
    onSaveEdit,
    onCancelEdit,
    onDeleteGroup,
  }: {
    groups: { id: string; name: string }[];
    loading: boolean;
    error: string | null;
    newGroupName: string;
    editingGroup: { id: string; name: string } | null;
    editName: string;
    onNewGroupNameChange: (v: string) => void;
    onAddGroup: () => void;
    onStartEdit: (g: { id: string; name: string }) => void;
    onEditNameChange: (v: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDeleteGroup: (id: string) => void;
  }) => {
    if (loading) return <div>Loading...</div>;
    return (
      <div>
        <h1>Group Administration</h1>
        {error && <div role="alert">{error}</div>}
        <input
          aria-label="New group name"
          value={newGroupName}
          onChange={e => onNewGroupNameChange(e.target.value)}
        />
        <button onClick={onAddGroup}>Add Group</button>
        {groups.length === 0 && <div>No groups yet. Add one above.</div>}
        <table>
          <tbody>
            {groups.map(g => (
              <tr key={g.id}>
                <td>
                  {editingGroup?.id === g.id ? (
                    <input
                      aria-label="Edit group name"
                      value={editName}
                      onChange={e => onEditNameChange(e.target.value)}
                    />
                  ) : (
                    g.name
                  )}
                </td>
                <td>
                  {editingGroup?.id === g.id ? (
                    <>
                      <button onClick={onSaveEdit}>Save</button>
                      <button onClick={onCancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onStartEdit(g)}>Edit {g.name}</button>
                      <button onClick={() => onDeleteGroup(g.id)}>Delete {g.name}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Admin Groups page', () => {
  let admin: ReturnType<typeof createGroupsAdminDsl>;

  beforeEach(() => {
    vi.clearAllMocks();
    reset_default_mocks();
    admin = createGroupsAdminDsl();
  });

  it('Given an admin is logged in, when they navigate to the groups page, then they can see the group administration page', async () => {
    given_an_authenticated_admin_session();
    given_no_groups_exist();
    await admin.navigatesToGroupsAdminPage();
    await then_groups_page_is_visible();
  });

  it('Given groups exist, when the admin navigates to the groups page, then all groups are listed', async () => {
    given_an_authenticated_admin_session();
    given_groups_exist([
      { id: 'g1', name: 'Training Band' },
      { id: 'g2', name: 'Concert Band' },
    ]);
    await admin.navigatesToGroupsAdminPage();
    await then_groups_are_listed(['Training Band', 'Concert Band']);
  });

  it('Given no groups exist, when the admin navigates to the groups page, then an empty state message is shown', async () => {
    given_an_authenticated_admin_session();
    given_no_groups_exist();
    await admin.navigatesToGroupsAdminPage();
    await then_empty_state_is_shown();
  });

  it('Given the admin is on the groups page, when they type a name and click add, then the group is created in Firestore', async () => {
    given_an_authenticated_admin_session();
    given_no_groups_exist();
    await admin.navigatesToGroupsAdminPage();
    await admin.typesNewGroupName('Training Band');
    await admin.clicksAddGroup();
    await then_group_was_created('Training Band');
  });

  it('Given a group exists, when the admin edits it and saves, then the group is updated in Firestore', async () => {
    given_an_authenticated_admin_session();
    given_groups_exist([{ id: 'g1', name: 'Training Band' }]);
    await admin.navigatesToGroupsAdminPage();
    await admin.clicksEditFor('Training Band');
    await admin.typesEditName('Concert Band');
    await admin.clicksSaveEdit();
    await then_group_was_updated('Concert Band');
  });

  it('Given a group exists, when the admin deletes it and confirms, then the group is removed from Firestore', async () => {
    given_an_authenticated_admin_session();
    given_groups_exist([{ id: 'g1', name: 'Training Band' }]);
    given_delete_confirmed();
    await admin.navigatesToGroupsAdminPage();
    await admin.clicksDeleteFor('Training Band');
    await then_group_was_deleted();
  });

  it('Given creating a group fails, when the admin submits, then an error message is shown', async () => {
    given_an_authenticated_admin_session();
    given_no_groups_exist();
    given_firestore_add_fails();
    await admin.navigatesToGroupsAdminPage();
    await admin.typesNewGroupName('Training Band');
    await admin.clicksAddGroup();
    await then_error_message_is_shown(/failed to create group/i);
  });

  it('Given updating a group fails, when the admin saves, then an error message is shown', async () => {
    given_an_authenticated_admin_session();
    given_groups_exist([{ id: 'g1', name: 'Training Band' }]);
    given_firestore_update_fails();
    await admin.navigatesToGroupsAdminPage();
    await admin.clicksEditFor('Training Band');
    await admin.typesEditName('Concert Band');
    await admin.clicksSaveEdit();
    await then_error_message_is_shown(/failed to update group/i);
  });

  it('Given deleting a group fails, when the admin confirms deletion, then an error message is shown', async () => {
    given_an_authenticated_admin_session();
    given_groups_exist([{ id: 'g1', name: 'Training Band' }]);
    given_delete_confirmed();
    given_firestore_delete_fails();
    await admin.navigatesToGroupsAdminPage();
    await admin.clicksDeleteFor('Training Band');
    await then_error_message_is_shown(/failed to delete group/i);
  });

  it('Given loading groups fails, when the admin navigates to the page, then an error message is shown', async () => {
    given_an_authenticated_admin_session();
    given_groups_fetch_fails();
    await admin.navigatesToGroupsAdminPage();
    await then_error_message_is_shown(/failed to load groups/i);
  });
});
