<script lang="ts">
  import { onMount } from 'svelte';
  import { loadGoogleMaps } from '$lib/services/googleMaps';
  import { appState } from '$lib/stores/appState.svelte';
  import { getGoogleMapsPath } from '$lib/services/route';

  let mapElement: HTMLDivElement;
  let map: google.maps.Map;
  let polyline: google.maps.Polyline;
  let marker: google.maps.Marker;

  const routePoints = getGoogleMapsPath();

  onMount(async () => {
    await loadGoogleMaps();

    map = new google.maps.Map(mapElement, {
      center: routePoints[0] || { lat: 35.6812, lng: 139.7671 },
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
      ]
    });

    polyline = new google.maps.Polyline({
      path: routePoints,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: map
    });

    marker = new google.maps.Marker({
      map: map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff',
        scale: 8
      }
    });

    $effect(() => {
      if (appState.currentCoords) {
        const position = { lat: appState.currentCoords[1], lng: appState.currentCoords[0] };
        marker.setPosition(position);
        map.panTo(position);
      }
    });
  });
</script>

<div bind:this={mapElement} class="w-full h-[300px] rounded-2xl shadow-inner bg-gray-100"></div>
