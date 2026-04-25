import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
import { browser } from '$app/environment';

if (browser) {
  if (!PUBLIC_GOOGLE_MAPS_API_KEY || PUBLIC_GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY') {
    console.warn('Google Maps API Key is missing or default. Check your .env file.');
  }
  setOptions({
    apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
    version: 'weekly'
  });
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
