<script lang="ts">
  import { onMount } from 'svelte';
  import { loadGoogleMaps } from '$lib/services/googleMaps';
  import { appState } from '$lib/stores/appState.svelte';

  let mapElement: HTMLDivElement;
  let map: google.maps.Map;
  let polyline: google.maps.Polyline;
  let marker: google.maps.Marker;

  // ルート座標データ (LatLng Literal形式)
  const routePoints = [
    { lat: 35.6812, lng: 139.7671 }, // 東京駅
    { lat: 35.6852, lng: 139.7611 },
    { lat: 35.6852, lng: 139.7528 }, // 皇居東御苑付近
    { lat: 35.6812, lng: 139.7450 }  // 半蔵門付近
  ];

  onMount(async () => {
    await loadGoogleMaps();

    // 1. 地図の初期化
    map = new google.maps.Map(mapElement, {
      center: routePoints[0],
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // 2. ルート（線）の描画
    polyline = new google.maps.Polyline({
      path: routePoints,
      geodesic: true,
      strokeColor: '#2563eb', // blue-600
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: map
    });

    // 3. 現在地マーカーの初期化
    marker = new google.maps.Marker({
      map: map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#ef4444', // red-500
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff',
        scale: 8
      }
    });

    // appState の現在地が更新されたらマーカーを動かすリアクティブな処理
    $effect(() => {
      if (appState.currentCoords) {
        const position = { 
          lat: appState.currentCoords[1], 
          lng: appState.currentCoords[0] 
        };
        marker.setPosition(position);
        map.panTo(position);
      }
    });
  });
</script>

<div bind:this={mapElement} class="w-full h-[300px] rounded-2xl shadow-inner bg-gray-100"></div>

<style>
  /* 地図コンテナのスタイル */
</style>
