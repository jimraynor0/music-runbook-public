import { useState } from 'react';
import { useGroups } from './hooks/useGroups';
import { Group } from '../../common/types/group';
import AdminGroupsPageView from './components/AdminGroupsPageView';

function AdminGroupsPage() {
  const { groups, loading, error, addGroup, editGroup, removeGroup } = useGroups();
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    try {
      await addGroup(trimmed);
      setNewGroupName('');
    } catch {
      // error is set by the hook
    }
  };

  const handleStartEdit = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
  };

  const handleSaveEdit = async () => {
    if (!editingGroup || !editName.trim()) return;
    try {
      await editGroup(editingGroup.id, editName.trim());
      setEditingGroup(null);
      setEditName('');
    } catch {
      // error is set by the hook
    }
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditName('');
  };

  const handleDeleteGroup = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await removeGroup(id);
      } catch {
        // error is set by the hook
      }
    }
  };

  return (
    <AdminGroupsPageView
      groups={groups}
      loading={loading}
      error={error}
      newGroupName={newGroupName}
      editingGroup={editingGroup}
      editName={editName}
      onNewGroupNameChange={setNewGroupName}
      onAddGroup={handleAddGroup}
      onStartEdit={handleStartEdit}
      onEditNameChange={setEditName}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      onDeleteGroup={handleDeleteGroup}
    />
  );
}

export default AdminGroupsPage;
