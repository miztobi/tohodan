import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
import { browser } from '$app/environment';

export async function loadMapLibrary() {
  if (!browser || !PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.warn('Map load skipped: Not in browser or API key is missing.');
    return null;
  }

  try {
    // 確実にキーを設定（テストHTMLの <script> 相当）
    setOptions({
      apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    // 最小限のマップコア機能のみを読み込む
    return await importLibrary('maps');
  } catch (e) {
    console.error('Failed to load Google Maps library:', e);
    return null;
  }
}

// 互換性のため残すが、実態はマップ機能から取り出す
export async function loadMarkerLibrary() {
  return loadMapLibrary();
}
