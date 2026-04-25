<script lang="ts">
  import Button from '$lib/components/atoms/Button.svelte';
  import ProgressCard from '$lib/components/molecules/ProgressCard.svelte';
  import { getCurrentLocation } from '$lib/services/location';
  import { calculateRouteProgress } from '$lib/utils/routeProgress';
  import { appState } from '$lib/stores/appState.svelte';
  import { Map } from 'lucide-svelte';

  // サンプルルートデータ（東京駅付近から皇居周辺）
  const dummyRoute: [number, number][] = [
    [139.7671, 35.6812], // 東京駅
    [139.7611, 35.6852],
    [139.7528, 35.6852], // 皇居東御苑付近
    [139.7450, 35.6812]  // 半蔵門付近
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

<div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
  <div class="w-full max-w-md space-y-8 text-center">
    <header>
      <div class="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
        <Map class="text-blue-600" size={32} />
      </div>
      <h1 class="text-3xl font-extrabold text-gray-900">tohodan</h1>
      <p class="text-gray-500 mt-2">ルート上の進捗を正確に追跡します</p>
    </header>

    <ProgressCard />

    <div class="flex flex-col gap-4">
      <Button 
        onclick={handleUpdateLocation} 
        disabled={appState.isTracking}
        class="w-full py-4 text-lg shadow-md"
      >
        {#if appState.isTracking}
          更新中...
        {:else}
          現在地を更新して進捗を確認
        {/if}
      </Button>

      {#if appState.error}
        <p class="text-red-500 text-sm font-medium">{appState.error}</p>
      {/if}
    </div>

    <footer class="pt-8 text-xs text-gray-400">
      <p>バッテリー消費を抑えるため、ボタン押下時のみ位置情報を取得します。</p>
    </footer>
  </div>
</div>

<style>
  :global(body) {
    font-family: 'Inter', sans-serif;
  }
</style>
