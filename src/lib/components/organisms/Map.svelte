<script lang="ts">
  import { onMount } from 'svelte';
  import { loadMapLibrary, loadMarkerLibrary } from '$lib/services/googleMaps';
  import { appState } from '$lib/stores/appState.svelte';
  import { getGoogleMapsPath } from '$lib/services/route';

  let mapElement: HTMLDivElement;
  let map: google.maps.Map;
  let polyline: google.maps.Polyline;
  let marker: any;

  const routePoints = getGoogleMapsPath();

  onMount(async () => {
    const mapsLib = await loadMapLibrary();
    const markerLib = await loadMarkerLibrary();

    if (!mapsLib || !markerLib || !mapElement) return;

    const { Map } = mapsLib;
    const { AdvancedMarkerElement, PinElement } = markerLib;

    map = new Map(mapElement, {
      center: routePoints[0] || { lat: 35.6812, lng: 139.7671 },
      zoom: 13,
      mapId: 'DEMO_MAP_ID',
      disableDefaultUI: true,
      zoomControl: true,
    });

    polyline = new google.maps.Polyline({
      path: routePoints,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: map
    });

    const pin = new PinElement({
      background: '#ef4444',
      borderColor: '#ffffff',
      glyphColor: '#ffffff',
      scale: 1.2
    });

    marker = new AdvancedMarkerElement({
      map: map,
      content: pin.element,
      title: '現在地'
    });

    $effect(() => {
      if (appState.currentCoords && marker) {
        const position = { 
          lat: appState.currentCoords[1], 
          lng: appState.currentCoords[0] 
        };
        marker.position = position;
        map.panTo(position);
      }
    });
  });
</script>

<div bind:this={mapElement} class="w-full h-[300px] rounded-2xl shadow-inner bg-gray-100"></div>
