<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { MapPin, TrendingUp } from 'lucide-svelte';

  const progressRounded = $derived(Math.round(appState.progress * 10) / 10);
</script>

<div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-2">
      <TrendingUp class="text-blue-600" size={24} />
      <span class="font-bold text-gray-700 text-lg">現在の進捗</span>
    </div>
    <span class="text-3xl font-black text-blue-600">{progressRounded}%</span>
  </div>

  <!-- プログレスバー -->
  <div class="w-full bg-gray-100 rounded-full h-4 mb-6 overflow-hidden">
    <div 
      class="bg-blue-600 h-full transition-all duration-500 ease-out"
      style="width: {appState.progress}%"
    ></div>
  </div>

  <div class="flex items-center gap-2 text-sm text-gray-500">
    <MapPin size={16} />
    {#if appState.currentCoords}
      <span>{appState.currentCoords[1].toFixed(5)}, {appState.currentCoords[0].toFixed(5)}</span>
    {:else}
      <span>位置情報未取得</span>
    {/if}
  </div>
</div>
