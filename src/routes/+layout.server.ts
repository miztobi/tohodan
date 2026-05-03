import { PUBLIC_GOOGLE_MAPS_API_KEY } from "$env/static/public";

export const load = async () => {
  return {
    googleMapsApiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
  };
};
