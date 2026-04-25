<script lang="ts">
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
  
  // カラーテーマの切り替え (カード背景は常に白、枠線で区別)
  const cardBgClass = $derived(isSegmentMode ? 'bg-white border-emerald-200 shadow-emerald-100/50' : 'bg-white border-gray-100');
  const iconBgClass = $derived(isSegmentMode ? 'bg-emerald-100' : 'bg-blue-50');
  const iconTextClass = $derived(isSegmentMode ? 'text-emerald-600' : 'text-blue-600');
  const highlightTextClass = $derived(isSegmentMode ? 'text-emerald-600' : 'text-blue-600');
  const barBgClass = $derived(isSegmentMode ? 'bg-emerald-500' : 'bg-blue-600');
  
  // プログレスバーの土台（トラック）の背景色
  const barTrackClass = $derived(isSegmentMode ? 'bg-white border border-emerald-100' : 'bg-black/5');
</script>

<div class="p-6 rounded-3xl shadow-xl border space-y-6 transition-all duration-500 {cardBgClass}">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-3 rounded-2xl {iconBgClass}">
        {#if isSegmentMode}
          <Navigation class="{iconTextClass}" size={28} />
        {:else}
          <TrendingUp class="{iconTextClass}" size={28} />
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
        <div class="flex items-baseline gap-1 {highlightTextClass}">
          <span class="text-sm font-bold opacity-80">残り</span>
          <span class="text-4xl font-black tracking-tighter">{remainingMins}</span>
          <span class="text-lg font-bold">分</span>
        </div>
      {:else}
        <span class="text-4xl font-black tracking-tighter {highlightTextClass}">
          {progressRounded}%
        </span>
      {/if}
    </div>
  </div>

  <!-- プログレスバー -->
  <div class="w-full {barTrackClass} rounded-full h-6 overflow-hidden shadow-inner relative">
    <div 
      class="h-full transition-all duration-700 ease-out shadow-lg {barBgClass}"
      style="width: {isSegmentMode ? segmentProgressPercent : appState.progress}%"
    ></div>
  </div>

  <div class="grid grid-cols-2 gap-4 pt-2">
    <div class="flex items-center gap-3 text-gray-500">
      <Clock size={20} class="{isSegmentMode ? 'text-emerald-400' : 'text-blue-400'}" />
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

  <div class="flex items-center gap-2 text-sm text-gray-400 bg-black/5 p-3 rounded-xl border border-white/50">
    <MapPin size={18} />
    {#if appState.currentCoords}
      <span class="font-mono">{appState.currentCoords[1].toFixed(5)}, {appState.currentCoords[0].toFixed(5)}</span>
    {:else}
      <span>位置情報未取得</span>
    {/if}
  </div>
</div>
