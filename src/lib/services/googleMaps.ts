import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
import { browser } from '$app/environment';

if (browser) {
  // SvelteKitの $env と Viteの import.meta.env の両方を安全にチェック
  // 本番環境（App Hosting）では $env/static/public が優先されます
  const apiKey = PUBLIC_GOOGLE_MAPS_API_KEY || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string);

  if (apiKey && apiKey !== 'YOUR_API_KEY') {
    setOptions({
      apiKey: apiKey,
      version: 'weekly'
    });
  } else {
    console.error('Google Maps API Key is missing. Check environment variables.');
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
