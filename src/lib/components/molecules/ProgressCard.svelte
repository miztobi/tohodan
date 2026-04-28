<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/stores/appState.svelte';
  import { routeSegments } from '$lib/services/route';
  import { MapPin, TrendingUp, Clock, Navigation } from 'lucide-svelte';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  import 'dayjs/locale/ja';

  dayjs.extend(relativeTime);
  dayjs.locale('ja');

  interface Props {
    segmentData: any; // { segment, segmentProgressRatio, estimatedMinutesPassed, estimatedMinutesRemaining, points } | null
  }

  let { segmentData }: Props = $props();
  let tick = $state(Date.now());
  
  onMount(() => {
    const updateTick = () => {
      if (document.visibilityState === 'visible') {
        tick = Date.now();
      }
    };
    const interval = setInterval(updateTick, 30000);
    document.addEventListener('visibilitychange', updateTick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', updateTick);
    };
  });

  const progressRounded = $derived(Math.round(appState.progress * 10) / 10);
  
  // 初期状態や位置情報がない時は「更新なし」と表示
  const lastUpdatedText = $derived(
    appState.lastUpdated 
      ? dayjs(appState.lastUpdated).from(tick) 
      : '更新なし'
  );
  
  const currentTimeText = $derived(dayjs(appState.currentTime).format('HH:mm'));

  // 全体の合計距離
  const totalDistanceKm = $derived(
    Math.round(routeSegments.reduce((acc, s) => acc + s.distanceKm, 0) * 100) / 100
  );
  
  // 現在の全体歩行距離 (km)
  const currentDistanceKm = $derived(
    Math.round((totalDistanceKm * (appState.progress / 100)) * 100) / 100
  );

  // 区間モードの計算値
  const isSegmentMode = $derived(appState.progressMode === 'segment');
  const segmentProgressPercent = $derived(segmentData ? segmentData.segmentProgressRatio * 100 : 0);
  const remainingMins = $derived(segmentData ? segmentData.estimatedMinutesRemaining : 0);
  
  // 区間内の歩行距離と区間総距離
  const segmentTotalKm = $derived(segmentData?.segment?.distanceKm || 0);
  const segmentCurrentKm = $derived(
    Math.round((segmentTotalKm * (segmentProgressPercent / 100)) * 100) / 100
  );

  const themeTextClass = $derived(isSegmentMode ? 'text-emerald-600' : 'text-blue-600');
  const themeIconBgClass = $derived(isSegmentMode ? 'bg-emerald-50' : 'bg-blue-50');
  const themeBarClass = $derived(isSegmentMode ? 'bg-emerald-500' : 'bg-blue-600');
  const themeClockIconClass = $derived(isSegmentMode ? 'text-emerald-400' : 'text-blue-400');
</script>

<div class="p-6 rounded-3xl shadow-xl border border-gray-100 bg-white space-y-6 transition-all duration-300">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <!-- 警告対応: class={themeIconBgClass} のようにクォーテーションを外す -->
      <div class={`p-3 rounded-2xl ${themeIconBgClass}`}>
        {#if isSegmentMode}
          <Navigation class={themeTextClass} size={28} />
        {:else}
          <TrendingUp class={themeTextClass} size={28} />
        {/if}
      </div>
      <div>
        <span class="font-bold text-gray-700 text-xl">
          {isSegmentMode ? '次の休憩まで' : '全体の進捗'}
        </span>
      </div>
    </div>
    
    <div class="text-right">
      {#if isSegmentMode}
        <div class={`flex items-baseline gap-1 ${themeTextClass}`}>
          <span class="text-sm font-bold opacity-80">残り</span>
          <span class="text-4xl font-black tracking-tighter">{remainingMins}</span>
          <span class="text-lg font-bold">分</span>
        </div>
      {:else}
        <span class={`text-4xl font-black tracking-tighter ${themeTextClass}`}>
          {progressRounded}%
        </span>
      {/if}
    </div>
  </div>

  <div class="space-y-2">
    <!-- 進捗(km)の表示 -->
    <div class="flex justify-between items-end px-1">
      <div class={`flex items-baseline gap-0.5 ${themeTextClass}`}>
        <span class="text-2xl font-black tracking-tight">
          {isSegmentMode ? segmentCurrentKm : currentDistanceKm}
        </span>
        <span class="text-xs font-bold opacity-70">km</span>
      </div>
      <div class="flex items-baseline gap-0.5 text-gray-400">
        <span class="text-sm font-bold">
          / {isSegmentMode ? segmentTotalKm : totalDistanceKm}
        </span>
        <span class="text-[10px] font-bold opacity-70">km</span>
      </div>
    </div>

    <!-- プログレスバー -->
    <div class="w-full bg-slate-100 rounded-full h-6 overflow-hidden shadow-inner relative">
      <div 
        class={`h-full transition-all duration-700 ease-out shadow-lg ${themeBarClass}`}
        style="width: {isSegmentMode ? segmentProgressPercent : appState.progress}%"
      ></div>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
    <div class="flex items-center gap-3 text-gray-500">
      <!-- 警告対応: クォーテーションを外す -->
      <Clock size={20} class={themeClockIconClass} />
      <div class="flex flex-col">
        <span class="text-[10px] uppercase font-black tracking-widest opacity-40">Last Update</span>
        <span class="text-base font-bold text-gray-700 leading-tight">{lastUpdatedText}</span>
      </div>
    </div>
    <div class="flex items-center gap-3 text-gray-500 justify-end">
      <div class="flex flex-col items-end">
        <span class="text-[10px] uppercase font-black tracking-widest opacity-40">Current Time</span>
        <span class="text-base font-bold text-gray-700 leading-tight">{currentTimeText}</span>
      </div>
      <Clock size={20} class={isSegmentMode ? 'text-emerald-500' : 'text-blue-500'} />
    </div>
  </div>

  <div class="flex items-center gap-2 text-sm text-gray-400 bg-slate-50 p-3 rounded-xl border border-gray-100">
    <MapPin size={18} />
    {#if appState.currentCoords}
      <span class="font-mono">{appState.currentCoords[1].toFixed(5)}, {appState.currentCoords[0].toFixed(5)}</span>
    {:else}
      <span>位置情報未取得</span>
    {/if}
  </div>
</div>
