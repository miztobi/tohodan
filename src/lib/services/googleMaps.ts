import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

setOptions({
  apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
  version: 'weekly'
});

export async function loadMapLibrary() {
  return importLibrary('maps') as Promise<typeof google.maps>;
}

export async function loadGeometryLibrary() {
  return importLibrary('geometry') as Promise<typeof google.maps.geometry>;
}

export async function loadMarkerLibrary() {
  return importLibrary('marker') as Promise<typeof google.maps.marker>;
}
