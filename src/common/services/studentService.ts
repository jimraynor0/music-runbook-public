import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Student } from '../types/student';
import { Group } from '../types/group';

const STUDENTS_COLLECTION = 'students';
const FAMILIES_COLLECTION = 'families';

export interface CsvRow {
  firstName: string;
  lastName?: string;
  group: string;
}

export interface ImportResult {
  studentsImported: number;
  familiesCreated: number;
}

export function parseCsv(csvText: string): CsvRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

  const firstNameIdx = headers.findIndex(h => h === 'first name' || h === 'firstname');
  const lastNameIdx = headers.findIndex(h => h === 'last name' || h === 'lastname');
  const groupIdx = headers.findIndex(h => h === 'group');

  if (firstNameIdx === -1) {
    throw new Error('CSV must have a "first name" column');
  }
  if (groupIdx === -1) {
    throw new Error('CSV must have a "group" column');
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const firstName = cols[firstNameIdx] || '';
    const lastName = lastNameIdx !== -1 ? cols[lastNameIdx] || '' : '';
    const group = cols[groupIdx] || '';

    if (!firstName) {
      throw new Error(`Row ${i + 1}: first name is required`);
    }
    if (!group) {
      throw new Error(`Row ${i + 1}: group is required`);
    }

    rows.push({
      firstName,
      lastName: lastName || undefined,
      group,
    });
  }

  if (rows.length === 0) {
    throw new Error('CSV file has no data rows');
  }

  return rows;
}

export function validateGroups(rows: CsvRow[], existingGroups: Group[]): void {
  const groupNames = new Set(existingGroups.map(g => g.name.toLowerCase()));
  const invalidGroups = new Set<string>();

  for (const row of rows) {
    if (!groupNames.has(row.group.toLowerCase())) {
      invalidGroups.add(row.group);
    }
  }

  if (invalidGroups.size > 0) {
    throw new Error(`Unknown groups: ${[...invalidGroups].join(', ')}`);
  }
}

function buildGroupLookup(groups: Group[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const g of groups) {
    lookup.set(g.name.toLowerCase(), g.id);
  }
  return lookup;
}

interface FamilyEntry {
  name: string;
}

function deriveFamilies(rows: CsvRow[]): { families: FamilyEntry[]; familyKeyPerRow: string[] } {
  const families: FamilyEntry[] = [];
  const familyKeyMap = new Map<string, number>(); // key -> index in families array
  const familyKeyPerRow: string[] = [];

  // Track first-name-only counts for collision handling
  const firstNameCounts = new Map<string, number>();

  for (const row of rows) {
    if (row.lastName) {
      const key = `last:${row.lastName.toLowerCase()}`;
      if (!familyKeyMap.has(key)) {
        familyKeyMap.set(key, families.length);
        families.push({ name: row.lastName });
      }
      familyKeyPerRow.push(key);
    } else {
      const baseKey = `first:${row.firstName.toLowerCase()}`;
      const count = firstNameCounts.get(baseKey) || 0;
      firstNameCounts.set(baseKey, count + 1);
      const key = count === 0 ? baseKey : `${baseKey}:${count + 1}`;
      familyKeyMap.set(key, families.length);
      families.push({ name: count === 0 ? row.firstName : `${row.firstName} ${count + 1}` });
      familyKeyPerRow.push(key);
    }
  }

  return { families, familyKeyPerRow };
}

export async function importStudents(rows: CsvRow[], groups: Group[]): Promise<ImportResult> {
  const groupLookup = buildGroupLookup(groups);
  const { families, familyKeyPerRow } = deriveFamilies(rows);

  const batch = writeBatch(db);

  // Delete all existing students
  const existingStudents = await getDocs(collection(db, STUDENTS_COLLECTION));
  existingStudents.docs.forEach(d => batch.delete(d.ref));

  // Delete all existing families
  const existingFamilies = await getDocs(collection(db, FAMILIES_COLLECTION));
  existingFamilies.docs.forEach(d => batch.delete(d.ref));

  // Create new families and track their refs
  const familyRefs: Map<number, string> = new Map();
  for (let i = 0; i < families.length; i++) {
    const familyRef = doc(collection(db, FAMILIES_COLLECTION));
    familyRefs.set(i, familyRef.id);
    batch.set(familyRef, { name: families[i].name });
  }

  // Build a map from familyKey -> familyRef index
  const familyKeyToIndex = new Map<string, number>();
  const seenKeys = new Set<string>();
  let familyIdx = 0;
  for (const key of familyKeyPerRow) {
    if (!seenKeys.has(key)) {
      familyKeyToIndex.set(key, familyIdx++);
      seenKeys.add(key);
    }
  }

  // Create new students
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const groupId = groupLookup.get(row.group.toLowerCase())!;
    const familyIndex = familyKeyToIndex.get(familyKeyPerRow[i])!;
    const familyId = familyRefs.get(familyIndex)!;

    const studentRef = doc(collection(db, STUDENTS_COLLECTION));
    const studentData: Omit<Student, 'id'> = {
      firstName: row.firstName,
      familyId,
      groupId,
    };
    if (row.lastName) {
      (studentData as Record<string, unknown>).lastName = row.lastName;
    }
    batch.set(studentRef, studentData);
  }

  await batch.commit();

  return {
    studentsImported: rows.length,
    familiesCreated: families.length,
  };
}
