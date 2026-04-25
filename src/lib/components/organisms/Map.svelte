<script lang="ts">
  import { onMount } from 'svelte';
  import { loadMapLibrary, loadMarkerLibrary } from '$lib/services/googleMaps';
  import { appState } from '$lib/stores/appState.svelte';
  import { getGoogleMapsPath, restPoints } from '$lib/services/route';

  let mapElement: HTMLDivElement;
  let map: google.maps.Map | undefined;
  let polyline: google.maps.Polyline | undefined;
  let userMarker: any | undefined;

  const routePoints = getGoogleMapsPath();

  onMount(async () => {
    try {
      const mapsLib = await loadMapLibrary();
      const markerLib = await loadMarkerLibrary();

      if (!mapsLib || !markerLib || !mapElement) return;

      const { Map, Polyline } = mapsLib as any;
      const { AdvancedMarkerElement, PinElement, InfoWindow } = markerLib as any;

      map = new Map(mapElement, {
        center: routePoints[0] || { lat: 35.6812, lng: 139.7671 },
        zoom: 13,
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: true,
        zoomControl: true,
      });

      polyline = new Polyline({
        path: routePoints,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
      });

      restPoints.forEach(point => {
        const restPin = new PinElement({
          background: '#10b981',
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          scale: 0.8
        });

        const m = new AdvancedMarkerElement({
          map: map,
          position: { lat: point.coords[1], lng: point.coords[0] },
          content: restPin.element,
          title: point.name
        });

        const infoWindow = new InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px; color: #1e293b;">${point.name}</h3>
              <p style="font-size: 11px; color: #64748b;">${point.description}</p>
            </div>
          `
        });

        m.addListener('click', () => {
          infoWindow.open(map, m);
        });
      });

      const userPin = new PinElement({
        background: '#3b82f6',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.2
      });

      userMarker = new AdvancedMarkerElement({
        map: map,
        content: userPin.element,
        title: '現在地'
      });
    } catch (err) {
      console.error('Map init error:', err);
    }

    $effect(() => {
      if (appState.currentCoords && userMarker && map) {
        const position = { lat: appState.currentCoords[1], lng: appState.currentCoords[0] };
        userMarker.position = position;
        map.panTo(position);
      }
    });
  });
</script>

<div bind:this={mapElement} class="w-full h-[300px] rounded-2xl shadow-inner bg-gray-100 flex items-center justify-center">
  {#if !map}
    <p class="text-xs text-slate-400 font-medium">地図を読み込み中...</p>
  {/if}
</div>
