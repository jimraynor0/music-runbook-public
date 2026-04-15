import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function isAuthorizedStaff(email: string): Promise<boolean> {
  try {
    const staffRef = collection(db, 'staffs');
    const q = query(staffRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking staff authorization:', error);
    return false;
  }
}