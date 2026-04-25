import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

export interface ProgressRecord {
  uid: string;
  coords: [number, number];
  progress: number;
  timestamp: any;
}

/**
 * 進捗を Firestore に保存します
 */
export async function saveProgress(uid: string, coords: [number, number], progress: number) {
  try {
    const docRef = await addDoc(collection(db, 'progress_history'), {
      uid,
      coords,
      progress,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
}

/**
 * 最新の進捗記録を取得します
 */
export async function getLatestProgress(uid: string): Promise<ProgressRecord | null> {
  try {
    const q = query(
      collection(db, 'progress_history'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return querySnapshot.docs[0].data() as ProgressRecord;
  } catch (error) {
    console.error('Error getting latest progress:', error);
    return null;
  }
}
