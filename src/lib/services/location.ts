import { db } from "./firebase";

/**
 * 現在の座標を一度だけ取得します（バッテリー節約設計）
 * @returns Promise<[number, number]> [longitude, latitude]
 */
export async function getCurrentLocation(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.longitude, position.coords.latitude]);
      },
      (error) => {
        reject(error);
      },
      options,
    );
  });
}

export interface ParticipantLocation {
  uid: string;
  coords: [number, number];
  progress: number;
  updatedAt: any;
  minutesAgo?: number;
}

/**
 * サーバー(SvelteKit API)から先頭と最後尾のデータのみを取得します
 */
export async function getActiveExtremes(): Promise<{
  leader: ParticipantLocation | null;
  trailer: ParticipantLocation | null;
}> {
  try {
    const response = await fetch("/api/participants");
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching active extremes from API:", error);
    return { leader: null, trailer: null };
  }
}
