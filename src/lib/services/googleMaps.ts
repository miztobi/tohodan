import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
import { browser } from '$app/environment';

if (browser) {
  // 開発・本番共通でこの一箇所のみを参照します
  if (PUBLIC_GOOGLE_MAPS_API_KEY) {
    setOptions({
      apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
      version: 'weekly'
    });
  } else {
    console.error('Google Maps API Key (PUBLIC_GOOGLE_MAPS_API_KEY) is not defined.');
  }
}

export async function loadMapLibrary() {
  if (!browser) return null;
  try {
    return await importLibrary('maps');
  } catch (e) {
    console.error('Failed to load Google Maps library:', e);
    return null;
  }
}

export async function loadMarkerLibrary() {
  if (!browser) return null;
  try {
    return await importLibrary('marker');
  } catch (e) {
    console.error('Failed to load Google Maps Marker library:', e);
    return null;
  }
}
