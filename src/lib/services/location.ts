import { db } from './firebase';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
/**
 * 現在の座標を一度だけ取得します（バッテリー節約設計）
 * @returns Promise<[number, number]> [longitude, latitude]
 */
export async function getCurrentLocation(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.longitude, position.coords.latitude]);
      },
      (error) => {
        reject(error);
      },
      options
    );
  });
}

export interface ParticipantLocation {
  uid: string;
  coords: [number, number];
  progress: number;
  updatedAt: any;
}

export async function getAllParticipants(): Promise<ParticipantLocation[]> {
  try {
    const q = query(collection(db, 'progress_history'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    // ユーザーごとの最新位置のみを保持
    const latestMap = new Map<string, ParticipantLocation>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!latestMap.has(data.uid)) {
        latestMap.set(data.uid, {
          uid: data.uid,
          coords: data.coords,
          progress: data.progress,
          updatedAt: data.timestamp
        });
      }
    });
    
    return Array.from(latestMap.values());
  } catch (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
}
