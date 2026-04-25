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
  import { activeRoute } from '$lib/services/route';
  import { Footprints, History } from 'lucide-svelte';

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
  <div class="w-full max-w-md space-y-6">
    <header class="pt-8 pb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
          <Footprints class="text-white" size={28} />
        </div>
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">tohodan</h1>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Route Tracker</p>
        </div>
      </div>
      <button class="p-2 text-slate-400 hover:text-blue-600 transition-colors">
        <History size={24} />
      </button>
    </header>

    <Map />
    <ProgressCard />

    <div class="space-y-4">
      <Button 
        onclick={handleUpdateLocation} 
        disabled={appState.isTracking}
        class="w-full py-4 text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
      >
        {#if appState.isTracking}
          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          保存中...
        {:else}
          現在地を更新
        {/if}
      </Button>

      {#if appState.error}
        <div class="p-3 bg-red-50 border border-red-100 rounded-lg">
          <p class="text-red-500 text-[10px] text-center font-semibold leading-tight">{appState.error}</p>
        </div>
      {/if}
    </div>

    <footer class="pt-4 text-center">
      <p class="text-[10px] text-slate-400 font-medium leading-relaxed">
        データはクラウドに安全に保存され、<br>
        次回のアクセス時にも自動的に復元されます。
      </p>
    </footer>
  </div>
</div>
