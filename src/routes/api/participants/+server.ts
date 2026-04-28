import { json } from '@sveltejs/kit';
import { db } from '$lib/services/firebase';
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore';

export async function GET() {
  try {
    const historyRef = collection(db, 'progress_history');
    let leader = null;
    let trailer = null;

    // 1. 先頭（Leader）の取得
    const leaderQuery = query(historyRef, orderBy('progress', 'desc'), limit(1));
    const leaderSnapshot = await getDocs(leaderQuery);
    
    if (!leaderSnapshot.empty) {
      const docData = leaderSnapshot.docs[0].data();
      const diffMs = Date.now() - docData.timestamp.toDate().getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      leader = {
        uid: docData.uid,
        coords: docData.coords,
        progress: docData.progress,
        updatedAt: docData.timestamp,
        minutesAgo: diffMinutes
      };
    }

    // 2. 最後尾（Trailer）の取得 (過去15分以内のアクティブユーザー)
    const ACTIVE_MINUTES = 15;
    const activeTimeLimit = new Date(Date.now() - ACTIVE_MINUTES * 60 * 1000);
    
    const trailerQuery = query(
      historyRef,
      where('timestamp', '>=', activeTimeLimit),
      orderBy('timestamp', 'desc')
    );
    const trailerSnapshot = await getDocs(trailerQuery);
    
    if (!trailerSnapshot.empty) {
      const latestMap = new Map<string, any>();
      trailerSnapshot.docs.forEach(doc => {
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

      const activeParticipants = Array.from(latestMap.values());
      activeParticipants.sort((a, b) => a.progress - b.progress);
      
      // 先頭と同じ人でなければ最後尾としてセットし、経過分数を計算
      if (activeParticipants[0].uid !== leader?.uid) {
        const trailerData = activeParticipants[0];
        const diffMs = Date.now() - trailerData.updatedAt.toDate().getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        trailer = {
          ...trailerData,
          minutesAgo: diffMinutes
        };
      }
    }

    return json({ leader, trailer });

  } catch (error) {
    console.error('API Error fetching participants:', error);
    return json({ leader: null, trailer: null, error: 'Failed to fetch data' }, { status: 500 });
  }
}
