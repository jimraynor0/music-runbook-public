import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Group } from '../types/group';

const COLLECTION_NAME = 'groups';

export async function fetchGroups(): Promise<Group[]> {
  const groupsQuery = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
  const snapshot = await getDocs(groupsQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
  }));
}

export async function createGroup(name: string): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), { name });
  return docRef.id;
}

export async function updateGroup(id: string, name: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, id), { name });
}

export async function deleteGroup(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
