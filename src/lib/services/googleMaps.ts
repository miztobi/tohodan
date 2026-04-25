import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { browser } from '$app/environment';

export async function loadMapLibrary() {
  // Viteの標準機能を使用して、ビルド時にキーを直接埋め込ませる（直書きと同じ効果）
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!browser || !apiKey) {
    console.warn('Map load skipped: Not in browser or VITE_GOOGLE_MAPS_API_KEY is missing.');
    return null;
  }

  try {
    setOptions({
      apiKey: apiKey,
      version: 'weekly',
    });

    return await importLibrary('maps');
  } catch (e) {
    console.error('Failed to load Google Maps library:', e);
    return null;
  }
}

export async function loadMarkerLibrary() {
  return loadMapLibrary();
}
