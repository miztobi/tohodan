<script lang="ts">
  import Button from '$lib/components/atoms/Button.svelte';
  import ProgressCard from '$lib/components/molecules/ProgressCard.svelte';
  import Map from '$lib/components/organisms/Map.svelte';
  import { getCurrentLocation } from '$lib/services/location';
  import { calculateRouteProgress } from '$lib/utils/routeProgress';
  import { appState } from '$lib/stores/appState.svelte';
  import { Footprints } from 'lucide-svelte';

  // サンプルルートデータ（Turf.js用 [lng, lat]）
  const dummyRoute: [number, number][] = [
    [139.7671, 35.6812],
    [139.7611, 35.6852],
    [139.7528, 35.6852],
    [139.7450, 35.6812]
  ];

  async function handleUpdateLocation() {
    appState.setTracking(true);
    appState.setError(null);

    try {
      const coords = await getCurrentLocation();
      const progress = calculateRouteProgress(coords, dummyRoute);
      appState.updateLocation(coords, progress);
    } catch (e: any) {
      appState.setError(e.message || '位置情報の取得に失敗しました');
    } finally {
      appState.setTracking(false);
    }
  }
</script>

<div class="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-12">
  <div class="w-full max-w-md space-y-6">
    <header class="pt-8 pb-4 flex items-center gap-3">
      <div class="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
        <Footprints class="text-white" size={28} />
      </div>
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">tohodan</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Route Tracker</p>
      </div>
    </header>

    <!-- 地図セクション -->
    <Map />

    <!-- 進捗カードセクション -->
    <ProgressCard />

    <!-- 操作セクション -->
    <div class="space-y-4">
      <Button 
        onclick={handleUpdateLocation} 
        disabled={appState.isTracking}
        class="w-full py-4 text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
      >
        {#if appState.isTracking}
          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          更新中...
        {:else}
          現在地を更新
        {/if}
      </Button>

      {#if appState.error}
        <div class="p-3 bg-red-50 border border-red-100 rounded-lg">
          <p class="text-red-500 text-xs text-center font-semibold">{appState.error}</p>
        </div>
      {/if}
    </div>

    <footer class="pt-4 text-center">
      <p class="text-[10px] text-slate-400 font-medium leading-relaxed">
        バッテリー節約のため、手動更新時のみGPSを使用します。<br>
        正確な進捗計算には Turf.js を使用しています。
      </p>
    </footer>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f8fafc;
  }
</style>
