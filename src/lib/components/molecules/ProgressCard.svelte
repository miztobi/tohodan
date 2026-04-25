<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/stores/appState.svelte';
  import { MapPin, TrendingUp, Clock, Navigation } from 'lucide-svelte';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  import 'dayjs/locale/ja';

  dayjs.extend(relativeTime);
  dayjs.locale('ja');

  interface Props {
    segmentData: any; // { segment, segmentProgressRatio, estimatedMinutesPassed, estimatedMinutesRemaining } | null
  }

  let { segmentData }: Props = $props();

  const progressRounded = $derived(Math.round(appState.progress * 10) / 10);
  const lastUpdatedText = $derived(appState.lastUpdated ? dayjs(appState.lastUpdated).fromNow() : '---');
  const currentTimeText = $derived(dayjs(appState.currentTime).format('HH:mm'));

  // 区間モードの計算値
  const segmentProgressPercent = $derived(segmentData ? segmentData.segmentProgressRatio * 100 : 0);
  const remainingMins = $derived(segmentData ? segmentData.estimatedMinutesRemaining : 0);

  // モードに応じたスタイルと値の切り替え
  const isSegmentMode = $derived(appState.progressMode === 'segment');
  
  // 文字色とアイコン色の分岐のみ残す
  const themeTextClass = $derived(isSegmentMode ? 'text-emerald-600' : 'text-blue-600');
  const themeIconBgClass = $derived(isSegmentMode ? 'bg-emerald-50' : 'bg-blue-50');
  const themeBarClass = $derived(isSegmentMode ? 'bg-emerald-500' : 'bg-blue-600');
  const themeClockIconClass = $derived(isSegmentMode ? 'text-emerald-400' : 'text-blue-400');
</script>

<div class="p-6 rounded-3xl shadow-xl border border-gray-100 bg-white space-y-6 transition-all duration-300">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-3 rounded-2xl {themeIconBgClass}">
        {#if isSegmentMode}
          <Navigation class="{themeTextClass}" size={28} />
        {:else}
          <TrendingUp class="{themeTextClass}" size={28} />
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
        <div class="flex items-baseline gap-1 {themeTextClass}">
          <span class="text-sm font-bold opacity-80">残り</span>
          <span class="text-4xl font-black tracking-tighter">{remainingMins}</span>
          <span class="text-lg font-bold">分</span>
        </div>
      {:else}
        <span class="text-4xl font-black tracking-tighter {themeTextClass}">
          {progressRounded}%
        </span>
      {/if}
    </div>
  </div>

  <!-- プログレスバー -->
  <div class="w-full bg-slate-100 rounded-full h-6 overflow-hidden shadow-inner relative">
    <div 
      class="h-full transition-all duration-700 ease-out shadow-lg {themeBarClass}"
      style="width: {isSegmentMode ? segmentProgressPercent : appState.progress}%"
    ></div>
  </div>

  <div class="grid grid-cols-2 gap-4 pt-2">
    <div class="flex items-center gap-3 text-gray-500">
      <Clock size={20} class="{themeClockIconClass}" />
      <div class="flex flex-col">
        <span class="text-[11px] uppercase font-bold tracking-wider opacity-60">Last Update</span>
        <span class="text-base font-bold text-gray-700">{lastUpdatedText}</span>
      </div>
    </div>
    <div class="flex items-center gap-3 text-gray-500 justify-end">
      <div class="flex flex-col items-end">
        <span class="text-[11px] uppercase font-bold tracking-wider opacity-60">Current Time</span>
        <span class="text-base font-bold text-gray-700">{currentTimeText}</span>
      </div>
      <Clock size={20} class="{isSegmentMode ? 'text-emerald-500' : 'text-blue-500'}" />
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
