import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface ProgressRecord {
  uid: string;
  coords: [number, number];
  progress: number;
  timestamp: any;
  role?: "user" | "head" | "tail" | "staff";
}

/**
 * 進捗を Firestore に保存します
 */
export async function saveProgress(
  uid: string,
  coords: [number, number],
  progress: number,
  role: "user" | "head" | "tail" | "staff" = "user",
) {
  try {
    const docRef = await addDoc(collection(db, "progress_history"), {
      uid,
      coords,
      progress,
      role,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving progress:", error);
    throw error;
  }
}

/**
 * 最新の進捗記録を取得します
 */
export async function getLatestProgress(
  uid: string,
): Promise<ProgressRecord | null> {
  try {
    const q = query(
      collection(db, "progress_history"),
      where("uid", "==", uid),
      orderBy("timestamp", "desc"),
      limit(1),
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const data = querySnapshot.docs[0].data();
    return {
      ...data,
      timestamp:
        data.timestamp instanceof Timestamp
          ? data.timestamp.toDate()
          : data.timestamp,
    } as ProgressRecord;
  } catch (error) {
    console.error("Error getting latest progress:", error);
    return null;
  }
}

/**
 * 全ユーザーの最新の進捗状況を取得します
 */
export async function getAllLatestProgress(): Promise<ProgressRecord[]> {
  try {
    // 直近24時間のデータを取得
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, "progress_history"),
      where("timestamp", ">=", Timestamp.fromDate(oneDayAgo)),
      orderBy("timestamp", "desc"),
    );
    const querySnapshot = await getDocs(q);

    const latestPerUser = new Map<string, ProgressRecord>();
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!latestPerUser.has(data.uid)) {
        latestPerUser.set(data.uid, {
          ...data,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate()
              : data.timestamp,
        } as ProgressRecord);
      }
    });

    return Array.from(latestPerUser.values());
  } catch (error) {
    console.error("Error getting all latest progress:", error);
    return [];
  }
}
