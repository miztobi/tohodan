import { importLibrary } from '@googlemaps/js-api-loader';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
import { browser } from '$app/environment';

export async function loadMapLibrary() {
  if (!browser || !PUBLIC_GOOGLE_MAPS_API_KEY) return null;
  try {
    // 最小限の 'maps' ライブラリのみを読み込む（テストHTMLと同じ条件）
    return await importLibrary('maps', {
      apiKey: PUBLIC_GOOGLE_MAPS_API_KEY
    });
  } catch (e) {
    console.error('Failed to load Google Maps library:', e);
    return null;
  }
}

// markerライブラリの個別読み込みはやめる（必要ならmapsから取る）
export async function loadMarkerLibrary() {
  return loadMapLibrary();
}
