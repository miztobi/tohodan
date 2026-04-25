<script lang='ts'>
  import { onMount } from 'svelte';
  import { loadMapLibrary, loadMarkerLibrary } from '$lib/services/googleMaps';
  import { appState } from '$lib/stores/appState.svelte';
  import { getGoogleMapsPath, restPoints } from '$lib/services/route';
  import { getAllParticipants } from '$lib/services/location';

  interface Props {
    activeSegmentPoints?: { lat: number, lng: number }[];
  }

  let { activeSegmentPoints }: Props = $props();

  let mapElement: HTMLDivElement;
  let map: google.maps.Map | undefined = $state();
  let basePolyline: google.maps.Polyline | undefined;
  let activePolyline: google.maps.Polyline | undefined;
  let userMarker: any | undefined;
  let leaderMarker: any | undefined;
  let trailerMarker: any | undefined;
  let infoWindow: any | undefined;

  const routePoints = getGoogleMapsPath();
  const routeLatLngs = routePoints.map(p => ({ lat: p.lat, lng: p.lng }));

  async function updateOtherParticipants(MarkerLib: any) {
    if (!map || !MarkerLib) return;
    try {
      const participants = await getAllParticipants();
      const { AdvancedMarkerElement, PinElement } = MarkerLib;
      const sorted = [...participants].sort((a, b) => b.progress - a.progress);
      if (sorted.length === 0) return;

      const leader = sorted[0];
      const trailer = sorted.length > 1 ? sorted[sorted.length - 1] : null;

      if (leader) {
        const leaderPin = new PinElement({ background: '#f59e0b', scale: 1.1, glyphText: '先', glyphColor: 'white' });
        if (!leaderMarker) {
          leaderMarker = new AdvancedMarkerElement({ map, content: leaderPin, title: '先頭' });
        }
        leaderMarker.position = { lat: leader.coords[1], lng: leader.coords[0] };
      }

      if (trailer) {
        const trailerPin = new PinElement({ background: '#64748b', scale: 1.1, glyphText: '後', glyphColor: 'white' });
        if (!trailerMarker) {
          trailerMarker = new AdvancedMarkerElement({ map, content: trailerPin, title: '最後尾' });
        }
        trailerMarker.position = { lat: trailer.coords[1], lng: trailer.coords[0] };
      }
    } catch (e) {
      console.error("Participants sync error:", e);
    }
  }

  onMount(async () => {
    try {
      const [mapsLib, markerLib] = await Promise.all([
        loadMapLibrary(),
        loadMarkerLibrary()
      ]);

      if (!mapsLib || !markerLib || !mapElement) return;

      const { Map, Polyline, InfoWindow } = mapsLib as any;
      const { AdvancedMarkerElement, PinElement } = markerLib as any;

      infoWindow = new InfoWindow();

      map = new Map(mapElement, {
        center: routeLatLngs[0],
        zoom: 14,
        mapId: 'DEMO_MAP_ID', // 課金設定が完全に反映されればこのままでも動くはずです
        disableDefaultUI: true,
        zoomControl: true,
      });

      basePolyline = new Polyline({
        path: routeLatLngs,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.3,
        strokeWeight: 4,
        map: map
      });

      activePolyline = new Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 1.0,
        strokeWeight: 8,
        zIndex: 10,
        map: map
      });

      restPoints.forEach((point) => {
        try {
          const lat = point.coords[1];
          const lng = point.coords[0];
          const actualLat = lat < 90 ? lat : lng;
          const actualLng = lat < 90 ? lng : lat;
          const isWarning = point.type === 'warning';
          
          const restPin = new PinElement({
            background: isWarning ? '#ef4444' : '#10b981',
            borderColor: '#ffffff',
            glyphColor: '#ffffff',
            scale: 0.9
          });

          const m = new AdvancedMarkerElement({
            map: map,
            position: { lat: actualLat, lng: actualLng },
            content: restPin, // .elementを削除
            title: point.name
          });

          m.addListener('gmp-click', () => {
            const themeColor = isWarning ? '#ef4444' : '#10b981';
            infoWindow.setContent(`
              <div style='padding: 12px; font-family: sans-serif; max-width: 220px;'>
                <h3 style='font-weight: 900; font-size: 20px; margin: 0 0 8px 0; color: #1e293b; border-bottom: 2px solid ${themeColor}; padding-bottom: 4px;'>${point.name}</h3>
                <p style='font-size: 16px; color: #475569; line-height: 1.5; margin: 0;'>${point.description || "詳細なし"}</p>
              </div>
            `);
            infoWindow.open(map, m);
          });
        } catch (e) {
          console.warn("Rest point render error:", e);
        }
      });

      const userPin = new PinElement({
        background: '#3b82f6',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.4
      });

      userMarker = new AdvancedMarkerElement({
        map: map,
        position: appState.currentCoords ? { lat: appState.currentCoords[1], lng: appState.currentCoords[0] } : routeLatLngs[0],
        content: userPin, // .elementを削除
        title: '現在地'
      });

      updateOtherParticipants(markerLib);
      const interval = setInterval(() => updateOtherParticipants(markerLib), 30000);
      return () => clearInterval(interval);
      
    } catch (err) {
      console.error('Fatal map initialization error:', err);
    }
  });

  $effect(() => {
    if (!map) return;
    if (appState.progressMode === 'total') {
      const bounds = new google.maps.LatLngBounds();
      routeLatLngs.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, 50);
      if (activePolyline) activePolyline.setPath([]);
    } else {
      if (activeSegmentPoints && activeSegmentPoints.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        activeSegmentPoints.forEach(p => bounds.extend(p));
        map.fitBounds(bounds, 80);
        if (activePolyline) {
          activePolyline.setPath(activeSegmentPoints);
          activePolyline.setOptions({ strokeColor: '#10b981', strokeWeight: 10 });
        }
      }
    }
  });

  $effect(() => {
    if (appState.currentCoords && userMarker && map) {
      const position = { lat: appState.currentCoords[1], lng: appState.currentCoords[0] };
      userMarker.position = position;
    }
  });
</script>

<div bind:this={mapElement} class='w-full h-[400px] rounded-[2.5rem] shadow-2xl border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden'>
  {#if !map}
    <div class='flex flex-col items-center gap-4'>
      <div class='w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin'></div>
      <p class='text-lg text-slate-500 font-bold'>地図を読み込み中...</p>
    </div>
  {/if}
</div>
