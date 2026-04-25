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
  import { Footprints, History, MapPin, Clock, AlertTriangle } from 'lucide-svelte';

  const totalDistance = routeSegments.reduce((acc, s) => acc + s.distanceKm, 0);

  const segmentData = $derived.by(() => {
    let accumulatedDistance = 0;
    const currentDistance = (appState.progress / 100) * totalDistance;

    for (const segment of routeSegments) {
      const segmentStartDist = accumulatedDistance;
      const segmentEndDist = accumulatedDistance + segment.distanceKm;
      
      if (currentDistance <= segmentEndDist || segment === routeSegments[routeSegments.length - 1]) {
        const distanceInSegment = Math.max(0, currentDistance - segmentStartDist);
        const segmentProgressRatio = Math.min(1, distanceInSegment / segment.distanceKm);
        const estimatedMinutesPassed = Math.round(segment.estimatedMinutes * segmentProgressRatio);
        const estimatedMinutesRemaining = Math.max(0, segment.estimatedMinutes - estimatedMinutesPassed);

        return {
          segment,
          segmentProgressRatio,
          estimatedMinutesPassed,
          estimatedMinutesRemaining,
          // Googleマップ用の座標形式に変換して渡す
          points: segment.points.map(p => ({ lat: p[1], lng: p[0] }))
        };
      }
      accumulatedDistance += segment.distanceKm;
    }
    return null;
  });

  onMount(() => {
    const timer = setInterval(() => {
      appState.currentTime = new Date();
    }, 10000);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const latest = await getLatestProgress(user.uid);
        if (latest) {
          appState.updateLocation(latest.coords, latest.progress);
        }
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
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

<div class="min-h-screen bg-slate-50 flex flex-col items-center p-6 pb-24">
  <div class="w-full max-w-md space-y-6">
    <header class="pt-6 pb-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-blue-600 rounded-2xl shadow-xl">
          <Footprints class="text-white" size={32} />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tighter">徒歩団参</h1>
          <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">Supported by 青年会髙安分会</p>
        </div>
      </div>
      <button class="p-3 bg-white text-slate-400 hover:text-blue-600 rounded-2xl shadow-sm border border-slate-100 transition-colors">
        <History size={28} />
      </button>
    </header>

    <!-- 地図セクション（現在の区間の座標を渡す） -->
    <Map activeSegmentPoints={segmentData?.points} />

    {#if segmentData?.segment}
      <div class="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between border-b-4 border-blue-800">
        <div class="space-y-2">
          <p class="text-xs font-black uppercase tracking-[0.2em] opacity-70">Current Segment</p>
          <h2 class="text-2xl font-black leading-tight tracking-tight">{segmentData.segment.name}</h2>
        </div>
        <div class="text-right shrink-0">
          <div class="flex items-center justify-end gap-1.5 font-black text-xl mb-1">
            <MapPin size={20} class="text-blue-200" />
            <span>{segmentData.segment.distanceKm} <span class="text-sm opacity-70">km</span></span>
          </div>
          <div class="flex items-center justify-end gap-1.5 text-sm font-bold opacity-80 bg-white/10 py-1 px-2 rounded-lg">
            <Clock size={16} />
            <span>約 {segmentData.segment.estimatedMinutes} 分</span>
          </div>
        </div>
      </div>
    {/if}

    <div class="flex bg-gray-200/60 p-1.5 rounded-2xl shadow-inner">
      <button
        onclick={() => appState.progressMode = 'total'}
        class="flex-1 py-3 text-lg font-bold rounded-xl transition-all duration-300 {appState.progressMode === 'total' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}"
      >
        全体の進捗
      </button>
      <button
        onclick={() => appState.progressMode = 'segment'}
        class="flex-1 py-3 text-lg font-bold rounded-xl transition-all duration-300 {appState.progressMode === 'segment' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}"
      >
        現在の区間
      </button>
    </div>

    <ProgressCard {segmentData} />

    <div class="space-y-4 pt-4">
      <Button 
        onclick={handleUpdateLocation} 
        disabled={appState.isTracking}
        class="w-full py-6 text-2xl font-black shadow-2xl rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-transform"
      >
        {#if appState.isTracking}
          <div class="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span class="animate-pulse">保存中...</span>
        {:else}
          <MapPin size={28} />
          現在地を更新
        {/if}
      </Button>

      <!-- 電池の消耗に関する注意書き -->
      <div class="flex items-start gap-2 px-4 py-2 text-slate-500">
        <AlertTriangle size={16} class="shrink-0 text-amber-500 mt-0.5" />
        <p class="text-[13px] font-bold leading-relaxed">
          頻繁に更新ボタンを押すと、電池の消耗が激しくなります。
        </p>
      </div>

      {#if appState.error}
        <div class="p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-center shadow-sm">
          <p class="text-red-500 text-sm font-bold">{appState.error}</p>
        </div>
      {/if}
    </div>
  </div>
</div>
