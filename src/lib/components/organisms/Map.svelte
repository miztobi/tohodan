<script lang="ts">
  import { onMount } from 'svelte';
  import { loadMapLibrary, loadMarkerLibrary } from '$lib/services/googleMaps';
  import { appState } from '$lib/stores/appState.svelte';
  import { getGoogleMapsPath } from '$lib/services/route';

  let mapElement: HTMLDivElement;
  let map: google.maps.Map;
  let polyline: google.maps.Polyline;
  let marker: any; // AdvancedMarkerElement

  const routePoints = getGoogleMapsPath();

  onMount(async () => {
    const { Map } = await loadMapLibrary();
    const { AdvancedMarkerElement, PinElement } = await loadMarkerLibrary();

    // 1. 地図の初期化
    map = new Map(mapElement, {
      center: routePoints[0] || { lat: 35.6812, lng: 139.7671 },
      zoom: 13,
      mapId: 'DEMO_MAP_ID', // AdvancedMarkerにはMap IDが必要（デモ用）
      disableDefaultUI: true,
      zoomControl: true,
    });

    // 2. ルート（線）の描画
    polyline = new google.maps.Polyline({
      path: routePoints,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: map
    });

    // 3. 現在地マーカー（ピン）の作成
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

    // リアクティブな位置更新
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
