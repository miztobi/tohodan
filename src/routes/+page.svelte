<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/atoms/Button.svelte';
  import ProgressCard from '$lib/components/molecules/ProgressCard.svelte';
  import Map from '$lib/components/organisms/Map.svelte';
  import { getCurrentLocation } from '$lib/services/location';
  import { calculateRouteProgress } from '$lib/utils/routeProgress';
  import { saveProgress, getLatestProgress } from '$lib/services/history';
  import { auth } from '$lib/services/firebase';
  import { appState } from '$lib/stores/appState.svelte';
  import { routeSegments, activeRoute } from '$lib/services/route';
  import { Footprints, History, MapPin, Clock } from 'lucide-svelte';

  // 現在の進捗率から、どの区間にいるかを判定する
  const currentSegment = $derived.by(() => {
    let accumulatedDistance = 0;
    const totalDistance = routeSegments.reduce((acc, s) => acc + s.distanceKm, 0);
    const currentDistance = (appState.progress / 100) * totalDistance;

    for (const segment of routeSegments) {
      accumulatedDistance += segment.distanceKm;
      if (currentDistance <= accumulatedDistance) return segment;
    }
    return routeSegments[routeSegments.length - 1];
  });

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const latest = await getLatestProgress(user.uid);
        if (latest) {
          appState.updateLocation(latest.coords, latest.progress);
        }
      }
    });
    return unsubscribe;
  });

  async function handleUpdateLocation() {
    appState.setTracking(true);
    appState.setError(null);

    try {
      const coords = await getCurrentLocation();
      const progress = calculateRouteProgress(coords, activeRoute);
      appState.updateLocation(coords, progress);

      const user = auth.currentUser;
      if (user) {
        await saveProgress(user.uid, coords, progress);
      }
    } catch (e: any) {
      appState.setError(e.message || '更新または保存に失敗しました');
    } finally {
      appState.setTracking(false);
    }
  }
</script>

<div class="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-12">
  <div class="w-full max-w-md space-y-4">
    <header class="pt-6 pb-2 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-blue-600 rounded-xl shadow-lg">
          <Footprints class="text-white" size={24} />
        </div>
        <div>
          <h1 class="text-xl font-black text-slate-900 tracking-tight">tohodan</h1>
        </div>
      </div>
      <button class="p-2 text-slate-400 hover:text-blue-600">
        <History size={24} />
      </button>
    </header>

    <!-- 地図セクション -->
    <Map />

    <!-- 現在の区間情報 -->
    {#if currentSegment}
      <div class="bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <div class="space-y-1">
          <p class="text-[10px] font-bold uppercase tracking-widest opacity-80">Current Segment</p>
          <h2 class="text-lg font-bold leading-tight">{currentSegment.name}</h2>
        </div>
        <div class="text-right">
          <div class="flex items-center justify-end gap-1 font-bold">
            <MapPin size={14} />
            <span>{currentSegment.distanceKm} km</span>
          </div>
          <div class="flex items-center justify-end gap-1 text-xs opacity-80">
            <Clock size={12} />
            <span>約 {currentSegment.estimatedMinutes} 分</span>
          </div>
        </div>
      </div>
    {/if}

    <ProgressCard />

    <div class="space-y-4">
      <Button 
        onclick={handleUpdateLocation} 
        disabled={appState.isTracking}
        class="w-full py-4 text-lg shadow-xl flex items-center justify-center gap-2"
      >
        {#if appState.isTracking}
          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          保存中...
        {:else}
          現在地を更新
        {/if}
      </Button>

      {#if appState.error}
        <div class="p-3 bg-red-50 border border-red-100 rounded-lg text-center">
          <p class="text-red-500 text-[10px] font-semibold">{appState.error}</p>
        </div>
      {/if}
    </div>
  </div>
</div>
