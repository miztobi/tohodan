<script lang='ts'>
  import { onMount } from 'svelte';
  import { loadMapLibrary } from '$lib/services/googleMaps';
  import { appState } from '$lib/stores/appState.svelte';
  import { getGoogleMapsPath, restPoints } from '$lib/services/route';
  import { getAllParticipants } from '$lib/services/location';

  interface Props {
    activeSegmentPoints?: { lat: number, lng: number }[];
  }

  let { activeSegmentPoints }: Props = $props();

  let mapElement: HTMLDivElement;
  let map: any | undefined = $state();
  let basePolyline: any | undefined;
  let activePolyline: any | undefined;
  let userMarker: any | undefined;
  let leaderMarker: any | undefined;
  let trailerMarker: any | undefined;
  let infoWindow: any | undefined;

  const routePoints = getGoogleMapsPath();
  const routeLatLngs = routePoints.map(p => ({ lat: p.lat, lng: p.lng }));

  // デザインをシンプルに変更（文字なしのピン）
  const createIcon = (color: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle fill="white" cx="12" cy="9" r="3.5"/></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  // 吹き出し表示用の共通関数
  const showInfo = (marker: any, title: string, color: string, description: string = '') => {
    if (!infoWindow || !map) return;
    infoWindow.setContent(`
      <div style='padding: 12px; font-family: sans-serif; min-width: 150px;'>
        <h3 style='font-weight: 900; font-size: 18px; margin: 0; color: #1e293b; border-bottom: 3px solid ${color}; padding-bottom: 4px;'>${title}</h3>
        ${description ? `<p style='font-size: 14px; color: #475569; margin-top: 8px;'>${description}</p>` : ''}
      </div>
    `);
    infoWindow.open(map, marker);
  };

  async function updateOtherParticipants(maps: any) {
    if (!map || !maps) return;
    try {
      const participants = await getAllParticipants();
      const sorted = [...participants].sort((a, b) => b.progress - a.progress);
      if (sorted.length === 0) return;

      const leader = sorted[0];
      const trailer = sorted.length > 1 ? sorted[sorted.length - 1] : null;

      if (leader) {
        if (!leaderMarker) {
          leaderMarker = new maps.Marker({ map, icon: createIcon('#f59e0b'), title: '先頭' });
          leaderMarker.addListener('click', () => showInfo(leaderMarker, '先頭集団', '#f59e0b'));
        }
        leaderMarker.setPosition({ lat: leader.coords[1], lng: leader.coords[0] });
      }

      if (trailer) {
        if (!trailerMarker) {
          trailerMarker = new maps.Marker({ map, icon: createIcon('#64748b'), title: '最後尾' });
          trailerMarker.addListener('click', () => showInfo(trailerMarker, '最後尾', '#64748b'));
        }
        trailerMarker.setPosition({ lat: trailer.coords[1], lng: trailer.coords[0] });
      }
    } catch (e) {
      console.error("Participants sync error:", e);
    }
  }

  onMount(async () => {
    try {
      const maps = await loadMapLibrary();
      if (!maps || !mapElement) return;

      infoWindow = new maps.InfoWindow();
      const center = routePoints.length > 0 ? routePoints[0] : { lat: 34.618, lng: 135.634 };

      map = new maps.Map(mapElement, {
        center: center,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
      });

      basePolyline = new maps.Polyline({
        path: routeLatLngs,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: map
      });

      activePolyline = new maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 1.0,
        strokeWeight: 8,
        zIndex: 10,
        map: map
      });

      restPoints.forEach((point) => {
        const isWarning = point.type === 'warning';
        const m = new maps.Marker({
          map: map,
          position: { lat: point.coords[1] < 90 ? point.coords[1] : point.coords[0], lng: point.coords[1] < 90 ? point.coords[0] : point.coords[1] },
          title: point.name,
          icon: createIcon(isWarning ? '#ef4444' : '#10b981')
        });

        m.addListener('click', () => {
          showInfo(m, point.name, isWarning ? '#ef4444' : '#10b981', point.description);
        });
      });

      userMarker = new maps.Marker({
        map: map,
        position: appState.currentCoords ? { lat: appState.currentCoords[1], lng: appState.currentCoords[0] } : routeLatLngs[0],
        title: '現在地',
        icon: createIcon('#3b82f6'),
        zIndex: 100
      });

      userMarker.addListener('click', () => showInfo(userMarker, 'あなたの現在地', '#3b82f6'));

      updateOtherParticipants(maps);
      const interval = setInterval(() => updateOtherParticipants(maps), 30000);
      return () => clearInterval(interval);
      
    } catch (err) {
      console.error('Fatal map initialization error:', err);
    }
  });

  $effect(() => {
    if (!map || !window.google) return;
    if (appState.progressMode === 'total') {
      const bounds = new window.google.maps.LatLngBounds();
      routeLatLngs.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, 50);
      if (activePolyline) activePolyline.setPath([]);
    } else {
      if (activeSegmentPoints && activeSegmentPoints.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
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
    if (appState.currentCoords && userMarker) {
      userMarker.setPosition({ lat: appState.currentCoords[1], lng: appState.currentCoords[0] });
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
