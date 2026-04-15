import { useGroups } from '../groups/hooks/useGroups';
import { useStudentImport } from './hooks/useStudentImport';
import AdminStudentsPageView from './components/AdminStudentsPageView';

function AdminStudentsPage() {
  const { groups, loading: groupsLoading } = useGroups();
  const {
    csvRows,
    parseError,
    importError,
    importResult,
    importing,
    handleFileSelected,
    handleImport,
    reset,
  } = useStudentImport();

  return (
    <AdminStudentsPageView
      groups={groups}
      groupsLoading={groupsLoading}
      csvRows={csvRows}
      parseError={parseError}
      importError={importError}
      importResult={importResult}
      importing={importing}
      onFileSelected={handleFileSelected}
      onImport={() => handleImport(groups)}
      onReset={reset}
    />
  );
}

export default AdminStudentsPage;
