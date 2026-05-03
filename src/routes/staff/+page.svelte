<script lang="ts">
  import { onMount } from "svelte";
  import ProgressCard from "$lib/components/molecules/ProgressCard.svelte";
  import RoleNav from "$lib/components/molecules/RoleNav.svelte";
  import Map from "$lib/components/organisms/Map.svelte";
  import MenuModal from "$lib/components/organisms/MenuModal.svelte";
  import Button from "$lib/components/atoms/Button.svelte";
  import { getAllLatestProgress, saveProgress, type ProgressRecord } from "$lib/services/history";
  import { routeSegments, activeRoute } from "$lib/services/route";
  import { getCurrentLocation } from "$lib/services/location";
  import { auth } from "$lib/services/firebase";
  import { appState } from "$lib/stores/appState.svelte";
  import { calculateRouteProgress } from "$lib/utils/routeProgress";
  import { Footprints, ShieldCheck, Users, MapPin, AlertTriangle } from "lucide-svelte";
  import dayjs from "dayjs";

  let participants = $state<ProgressRecord[]>([]);
  let isMenuOpen = $state(false);
  const totalDistance = routeSegments.reduce((acc, s) => acc + s.distanceKm, 0);

  // 先頭ユーザーのデータをベースにした進捗表示用（'head'タグを持つユーザーを優先）
  const leadParticipant = $derived(
    participants.find(p => p.role === "head") || (participants.length > 0 ? participants.reduce((prev, curr) => (prev.progress > curr.progress ? prev : curr)) : null)
  );

  const segmentData = $derived.by(() => {
    if (!leadParticipant) return null;
    
    let accumulatedDistance = 0;
    const currentDistance = (leadParticipant.progress / 100) * totalDistance;

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
          points: segment.points.map((p) => ({ lat: p[1], lng: p[0] })),
        };
      }
      accumulatedDistance += segment.distanceKm;
    }
    return null;
  });

  // 更新時間に応じた色の計算
  function getMarkerColor(timestamp: any) {
    if (!timestamp) return "#64748b"; // グレー
    const diffMins = dayjs().diff(dayjs(timestamp), "minute");
    
    if (diffMins <= 0) return "#3b82f6"; // 青
    if (diffMins >= 30) return "#94a3b8"; // グレー
    
    // 0〜30分の間で色を補完 (簡易的に15分付近で色を変える)
    if (diffMins < 15) return "#60a5fa"; // 明るい青
    return "#cbd5e1"; // 薄いグレー
  }

  const mapParticipants = $derived(
    participants.map((p) => ({
      uid: p.uid,
      coords: p.coords,
      color: getMarkerColor(p.timestamp),
      title: `ユーザー: ${p.uid.slice(0, 5)}...`,
      description: `更新: ${dayjs(p.timestamp).format("HH:mm")} (${dayjs(p.timestamp).fromNow()})`,
      role: p.role,
    }))
  );

  async function handleUpdateLocation() {
    appState.setTracking(true);
    appState.setError(null);

    try {
      const coords = await getCurrentLocation();
      const progress = calculateRouteProgress(coords, activeRoute);
      appState.updateLocation(coords, progress);

      const user = auth.currentUser;
      if (user) {
        await saveProgress(user.uid, coords, progress, "staff");
      }
      
      participants = await getAllLatestProgress();
    } catch (e: any) {
      appState.setError(e.message || "更新または保存に失敗しました");
    } finally {
      appState.setTracking(false);
    }
  }

  onMount(() => {
    const fetchData = async () => {
      participants = await getAllLatestProgress();
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30秒ごとに更新

    const timer = setInterval(() => {
      appState.currentTime = new Date();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  });

  $effect(() => {
    if (leadParticipant) {
      appState.progress = leadParticipant.progress;
      appState.lastUpdated = leadParticipant.timestamp;
    }
  });
</script>

<div class="min-h-screen bg-slate-900 flex flex-col items-center p-6 pb-24">
  <div class="w-full max-w-md space-y-6">
    <header class="pt-6 pb-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-emerald-600 rounded-2xl shadow-xl">
          <ShieldCheck class="text-white" size={32} />
        </div>
        <div>
          <h1 class="text-3xl font-black text-white tracking-tighter">tohodan <span class="text-emerald-500">STAFF</span></h1>
          <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">Management Console</p>
        </div>
      </div>
      <RoleNav onMenuClick={() => isMenuOpen = true} />
    </header>

    <div class="bg-slate-800 rounded-[2.5rem] p-1 border border-slate-700 shadow-2xl">
      <Map participants={mapParticipants} activeSegmentPoints={segmentData?.points} />
    </div>

    {#if segmentData?.segment}
      <div class="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between border-b-4 border-emerald-800">
        <div class="space-y-2">
          <p class="text-xs font-black uppercase tracking-[0.2em] opacity-70">Current Segment (Lead)</p>
          <h2 class="text-2xl font-black leading-tight tracking-tight">{segmentData.segment.name}</h2>
        </div>
      </div>
    {/if}

    <div class="bg-white rounded-[2rem] overflow-hidden shadow-2xl">
      <ProgressCard {segmentData} />
    </div>

    <div class="space-y-4 pt-4">
      <Button 
        onclick={handleUpdateLocation} 
        disabled={appState.isTracking}
        class="w-full py-6 text-2xl font-black shadow-2xl rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-transform bg-emerald-600 hover:bg-emerald-700 border-none text-white"
      >
        {#if appState.isTracking}
          <div class="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span class="animate-pulse">保存中...</span>
        {:else}
          <MapPin size={28} />
          スタッフの位置を更新
        {/if}
      </Button>

      <div class="flex items-start gap-2 px-4 py-2 text-slate-400">
        <AlertTriangle size={16} class="shrink-0 text-amber-500 mt-0.5" />
        <p class="text-[13px] font-bold leading-relaxed">
          頻繁に更新ボタンを押すと、スマートフォンの電池の消耗が激しくなります。
        </p>
      </div>
      <div class="flex items-start gap-2 px-4 py-2 text-slate-400">
        <AlertTriangle size={16} class="shrink-0 text-amber-500 mt-0.5" />
        <p class="text-[13px] font-bold leading-relaxed">
          端末の位置情報設定がオフになっていると、現在地を更新できないのでご注意ください。
        </p>
      </div>

      {#if appState.error}
        <div class="p-4 bg-red-900/50 border-2 border-red-500 rounded-2xl text-center shadow-sm">
          <p class="text-red-400 text-sm font-bold">{appState.error}</p>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="bg-slate-800 p-4 rounded-3xl border border-slate-700 flex items-center gap-4">
        <div class="p-3 bg-blue-500/10 rounded-2xl">
          <Users class="text-blue-500" size={24} />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Users</p>
          <p class="text-2xl font-black text-white">{participants.length}</p>
        </div>
      </div>
      <div class="bg-slate-800 p-4 rounded-3xl border border-slate-700 flex items-center gap-4">
        <div class="p-3 bg-emerald-500/10 rounded-2xl">
          <Footprints class="text-emerald-500" size={24} />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Progress</p>
          <p class="text-2xl font-black text-white">{leadParticipant ? Math.round(leadParticipant.progress) : 0}%</p>
        </div>
      </div>
    </div>

    <div class="p-6 bg-slate-800 rounded-[2rem] border border-slate-700 space-y-4">
      <h3 class="text-lg font-black text-white flex items-center gap-2">
        <Users size={20} class="text-emerald-500" />
        参加者リスト
      </h3>
      <div class="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {#each participants as p (p.uid)}
          <div class="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full" style="background-color: {getMarkerColor(p.timestamp)}"></div>
              <span class="text-sm font-bold text-slate-200">{p.uid.slice(0, 8)}...</span>
            </div>
            <div class="text-right">
              <p class="text-xs font-black text-emerald-400">{Math.round(p.progress)}%</p>
              <p class="text-[10px] text-slate-400">{dayjs(p.timestamp).format("HH:mm")}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<MenuModal isOpen={isMenuOpen} onClose={() => isMenuOpen = false} />

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 10px;
  }
</style>
