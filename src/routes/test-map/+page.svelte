<script lang="ts">
  import { onMount } from 'svelte';
  import { loadMapLibrary } from '$lib/services/googleMaps';

  let mapElement: HTMLDivElement;
  let map: google.maps.Map | undefined = $state();
  let errorMsg: string | null = $state(null);

  onMount(async () => {
    try {
      const mapsLib = await loadMapLibrary();

      if (!mapsLib) {
        errorMsg = "Google Maps APIの読み込みに失敗しました。APIキー（PUBLIC_GOOGLE_MAPS_API_KEY）が正しく設定されているか確認してください。";
        return;
      }

      if (!mapElement) return;

      const { Map } = mapsLib as any;

      map = new Map(mapElement, {
        center: { lat: 34.618, lng: 135.634 }, // テスト用の初期位置（大教会付近）
        zoom: 14,
        disableDefaultUI: false, // テスト用なのでUIを表示して動かせるようにする
      });
      
    } catch (err: any) {
      console.error('Test map initialization error:', err);
      errorMsg = err.message || "地図の初期化中にエラーが発生しました。";
    }
  });
</script>

<div class="p-6 max-w-4xl mx-auto space-y-6">
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
    <h1 class="text-2xl font-bold mb-2">Google Maps 読み込みテスト</h1>
    <p class="text-gray-600 mb-4">
      このページは、SvelteKit経由で <code>PUBLIC_GOOGLE_MAPS_API_KEY</code> が正しく読み込まれ、地図が表示されるかをテストするためのものです。
    </p>

    {#if errorMsg}
      <div class="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 font-bold">
        {errorMsg}
      </div>
    {/if}
  </div>

  <div class="bg-white p-2 rounded-3xl shadow-lg border-4 border-white">
    <div bind:this={mapElement} class="w-full h-[500px] rounded-2xl bg-gray-100 flex flex-col items-center justify-center">
      {#if !map && !errorMsg}
        <div class="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-500 font-bold">地図を読み込み中...</p>
      {/if}
    </div>
  </div>
</div>
