import { useState, useEffect, useCallback } from 'react';
import { Group } from '../../../common/types/group';
import { fetchGroups, createGroup, updateGroup, deleteGroup } from '../../../common/services/groupService';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGroups();
      setGroups(data);
    } catch {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const addGroup = async (name: string) => {
    try {
      setError(null);
      await createGroup(name);
      await loadGroups();
    } catch {
      setError('Failed to create group');
      throw new Error('Failed to create group');
    }
  };

  const editGroup = async (id: string, name: string) => {
    try {
      setError(null);
      await updateGroup(id, name);
      await loadGroups();
    } catch {
      setError('Failed to update group');
      throw new Error('Failed to update group');
    }
  };

  const removeGroup = async (id: string) => {
    try {
      setError(null);
      await deleteGroup(id);
      await loadGroups();
    } catch {
      setError('Failed to delete group');
      throw new Error('Failed to delete group');
    }
  };

  return { groups, loading, error, addGroup, editGroup, removeGroup };
}
