import { json } from "@sveltejs/kit";
import { db } from "$lib/services/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  Timestamp,
} from "firebase/firestore";

export async function GET() {
  try {
    const historyRef = collection(db, "progress_history");
    let leader = null;
    let trailer = null;

    // 複合インデックスを避けるため、直近24時間のデータを取得してメモリ上でフィルタリングする
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      historyRef,
      where("timestamp", ">=", Timestamp.fromDate(oneDayAgo)),
      orderBy("timestamp", "desc"),
    );

    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // 最初に見つかった 'head' タグのデータ（降順なので最新）
      if (data.role === "head" && !leader) {
        const timestamp =
          data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : data.timestamp;
        const diffMs = Date.now() - timestamp.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        leader = {
          uid: data.uid,
          coords: data.coords,
          progress: data.progress,
          updatedAt: data.timestamp,
          minutesAgo: diffMinutes,
        };
      }

      // 最初に見つかった 'tail' タグのデータ（降順なので最新）
      if (data.role === "tail" && !trailer) {
        const timestamp =
          data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : data.timestamp;
        const diffMs = Date.now() - timestamp.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        trailer = {
          uid: data.uid,
          coords: data.coords,
          progress: data.progress,
          updatedAt: data.timestamp,
          minutesAgo: diffMinutes,
        };
      }

      // 両方見つかればループを終了
      if (leader && trailer) break;
    }

    return json({ leader, trailer });
  } catch (error) {
    console.error("API Error fetching participants:", error);
    return json(
      { leader: null, trailer: null, error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
