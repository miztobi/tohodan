import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
import { browser } from '$app/environment';

if (browser) {
  setOptions({
    apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
    version: 'weekly'
  });
}

export async function loadMapLibrary() {
  if (!browser) return null;
  return importLibrary('maps') as Promise<typeof google.maps>;
}

export async function loadGeometryLibrary() {
  if (!browser) return null;
  return importLibrary('geometry') as Promise<typeof google.maps.geometry>;
}

export async function loadMarkerLibrary() {
  if (!browser) return null;
  return importLibrary('marker') as Promise<typeof google.maps.marker>;
}
