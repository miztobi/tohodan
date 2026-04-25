import { Loader } from '@googlemaps/js-api-loader';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

const loader = new Loader({
  apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['geometry']
});

export async function loadGoogleMaps() {
  return loader.load();
}
