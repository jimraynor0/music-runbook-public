import { useState } from 'react';
import { parseCsv, validateGroups, importStudents, CsvRow, ImportResult } from '../../../common/services/studentService';
import { Group } from '../../../common/types/group';

export function useStudentImport() {
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileSelected = (file: File) => {
    setParseError(null);
    setImportError(null);
    setImportResult(null);
    setCsvRows(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCsv(text);
        setCsvRows(rows);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Failed to parse CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async (groups: Group[]) => {
    if (!csvRows) return;

    setImportError(null);
    setImportResult(null);

    try {
      validateGroups(csvRows, groups);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Validation failed');
      return;
    }

    try {
      setImporting(true);
      const result = await importStudents(csvRows, groups);
      setImportResult(result);
      setCsvRows(null);
    } catch {
      setImportError('Failed to import students');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setCsvRows(null);
    setParseError(null);
    setImportError(null);
    setImportResult(null);
  };

  return {
    csvRows,
    parseError,
    importError,
    importResult,
    importing,
    handleFileSelected,
    handleImport,
    reset,
  };
}
