<script lang="ts">
  import { onMount } from "svelte";
  import { loadMapLibrary } from "$lib/services/googleMaps";
  import { appState } from "$lib/stores/appState.svelte";
  import { getGoogleMapsPath, restPoints } from "$lib/services/route";
  import { getActiveExtremes } from "$lib/services/location";

  interface ParticipantMarker {
    uid: string;
    coords: [number, number];
    color: string;
    title: string;
    description: string;
    role?: string;
  }

  interface Props {
    activeSegmentPoints?: { lat: number; lng: number }[];
    participants?: ParticipantMarker[];
  }

  let { activeSegmentPoints, participants = [] }: Props = $props();

  let mapElement: HTMLDivElement;
  let map: any | undefined = $state();
  let basePolyline: any | undefined;
  let activePolyline: any | undefined;
  let userMarker: any | undefined;
  let leaderMarker: any | undefined;
  let trailerMarker: any | undefined;
  let infoWindow: any | undefined;

  // 参加者マーカーのキャッシュ
  let participantMarkerMap = new Map<string, any>();

  const routePoints = getGoogleMapsPath();
  const routeLatLngs = routePoints.map((p) => ({ lat: p.lat, lng: p.lng }));

  const createMarkerElement = (color: string, role?: string) => {
    const div = document.createElement("div");
    
    let svgPath = "";
    if (role === "head" || role === "tail") {
      // 旗 (Flag)
      svgPath = `<path fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      div.innerHTML = `<div style="background-color: white; padding: 4px; border-radius: 50%; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">${svgPath}</svg></div>`;
    } else if (role === "user" || role === "staff") {
      // 人 (Person standing)
      svgPath = `<circle cx="12" cy="5" r="1.5" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 20-2-5 3-1.5M17 20l-2-5-3-1.5M12 8.5V14M15 11l-3-2.5-3 2.5"/>`;
      div.innerHTML = `<div style="background-color: white; padding: 4px; border-radius: 50%; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">${svgPath}</svg></div>`;
    } else {
      // 従来のピン (Marker / Rest point)
      svgPath = `<path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle fill="white" cx="12" cy="9" r="3.5"/>`;
      div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">${svgPath}</svg>`;
    }
    
    return div;
  };

  const showInfo = (
    marker: any,
    title: string,
    color: string,
    description: string = "",
  ) => {
    if (!infoWindow || !map) return;
    infoWindow.setContent(`
      <div style='padding: 12px; font-family: sans-serif; min-width: 150px;'>
        <h3 style='font-weight: 900; font-size: 18px; margin: 0; color: #1e293b; border-bottom: 3px solid ${color}; padding-bottom: 4px;'>${title}</h3>
        ${description ? `<p style='font-size: 14px; color: #475569; margin-top: 8px;'>${description}</p>` : ""}
      </div>
    `);
    infoWindow.open(map, marker);
  };

  async function updateOtherParticipants(maps: any) {
    // participantsプロップスが提供されている場合は、この自動更新（Leader/Trailer）はスキップする
    if (!map || !maps || participants.length > 0) return;
    try {
      const { leader, trailer } = await getActiveExtremes();

      if (leader) {
        const timeText =
          leader.minutesAgo !== undefined ? `(${leader.minutesAgo}分前)` : "";
        if (!leaderMarker) {
          leaderMarker = new maps.marker.AdvancedMarkerElement({
            map,
            content: createMarkerElement("#f59e0b", "head"),
          });
        }
        leaderMarker.position = { lat: leader.coords[1], lng: leader.coords[0] };
        maps.event.clearListeners(leaderMarker, "gmp-click");
        leaderMarker.addListener("gmp-click", () =>
          showInfo(leaderMarker, "先頭集団", "#f59e0b", timeText),
        );
      }

      if (trailer) {
        const timeText =
          trailer.minutesAgo !== undefined ? `(${trailer.minutesAgo}分前)` : "";
        if (!trailerMarker) {
          trailerMarker = new maps.marker.AdvancedMarkerElement({
            map,
            content: createMarkerElement("#64748b", "tail"),
          });
        }
        trailerMarker.position = {
          lat: trailer.coords[1],
          lng: trailer.coords[0],
        };
        maps.event.clearListeners(trailerMarker, "gmp-click");
        trailerMarker.addListener("gmp-click", () =>
          showInfo(trailerMarker, "最後尾", "#64748b", timeText),
        );
      }
    } catch (e) {
      console.error("Participants sync error:", e);
    }
  }

  onMount(() => {
    let interval: ReturnType<typeof setInterval>;

    const initMap = async () => {
      try {
        const maps = await loadMapLibrary();
        if (!maps || !mapElement) return;

        infoWindow = new maps.InfoWindow();
        const center =
          routePoints.length > 0 ? routePoints[0] : { lat: 34.618, lng: 135.634 };

        map = new maps.Map(mapElement, {
          center: center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          mapId: "tohodan_map_v1", // AdvancedMarkerElementに必要
        });

        basePolyline = new maps.Polyline({
          path: routeLatLngs,
          geodesic: true,
          strokeColor: "#2563eb",
          strokeOpacity: 1.0,
          strokeWeight: 4,
          map: map,
        });

        activePolyline = new maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: "#3b82f6",
          strokeOpacity: 1.0,
          strokeWeight: 8,
          zIndex: 10,
          map: map,
        });

        restPoints.forEach((point) => {
          const isWarning = point.type === "warning";
          const m = new maps.marker.AdvancedMarkerElement({
            map: map,
            position: {
              lat: point.coords[1] < 90 ? point.coords[1] : point.coords[0],
              lng: point.coords[1] < 90 ? point.coords[0] : point.coords[1],
            },
            content: createMarkerElement(isWarning ? "#ef4444" : "#10b981", "marker"),
          });

          m.addListener("gmp-click", () => {
            showInfo(
              m,
              point.name,
              isWarning ? "#ef4444" : "#10b981",
              point.description,
            );
          });
        });

        // 通常ユーザー用のマーカー（スタッフページ以外）
        if (participants.length === 0) {
          userMarker = new maps.marker.AdvancedMarkerElement({
            map: map,
            position: appState.currentCoords
              ? { lat: appState.currentCoords[1], lng: appState.currentCoords[0] }
              : routeLatLngs[0],
            content: createMarkerElement("#3b82f6", "user"),
            zIndex: 100,
          });

          userMarker.addListener("gmp-click", () =>
            showInfo(userMarker, "あなたの現在地", "#3b82f6"),
          );

          updateOtherParticipants(maps);
          interval = setInterval(() => updateOtherParticipants(maps), 30000);
        }
      } catch (err) {
        console.error("Fatal map initialization error:", err);
      }
    };

    initMap();

    return () => {
      if (interval) clearInterval(interval);
    };
  });

  $effect(() => {
    if (!map || !window.google) return;
    if (appState.progressMode === "total") {
      const bounds = new window.google.maps.LatLngBounds();
      routeLatLngs.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 50);
      if (activePolyline) activePolyline.setPath([]);
    } else {
      if (activeSegmentPoints && activeSegmentPoints.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        activeSegmentPoints.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, 80);
        if (activePolyline) {
          activePolyline.setPath(activeSegmentPoints);
          activePolyline.setOptions({ strokeColor: "#10b981", strokeWeight: 10 });
        }
      }
    }
  });

  // 参加者マーカーの同期（スタッフページ用）
  $effect(() => {
    if (!map || !window.google || participants.length === 0) return;
    const maps = window.google.maps;

    // 現在のUIDセット
    const currentUids = new Set(participants.map((p) => p.uid));

    // 不要になったマーカーを削除
    participantMarkerMap.forEach((marker, uid) => {
      if (!currentUids.has(uid)) {
        marker.map = null;
        participantMarkerMap.delete(uid);
      }
    });

    // マーカーの追加・更新
    participants.forEach((p) => {
      let marker = participantMarkerMap.get(p.uid);
      if (!marker) {
        marker = new maps.marker.AdvancedMarkerElement({
          map,
          content: createMarkerElement(p.color, p.role),
        });
        participantMarkerMap.set(p.uid, marker);
      } else {
        // コンテンツ（色や形）の更新
        marker.content = createMarkerElement(p.color, p.role);
      }
      marker.position = { lat: p.coords[1], lng: p.coords[0] };

      maps.event.clearListeners(marker, "gmp-click");
      marker.addListener("gmp-click", () =>
        showInfo(marker, p.title, p.color, p.description),
      );
    });
  });

  $effect(() => {
    if (appState.currentCoords && userMarker && participants.length === 0) {
      userMarker.position = {
        lat: appState.currentCoords[1],
        lng: appState.currentCoords[0],
      };
    }
  });
</script>

<div
  bind:this={mapElement}
  class="w-full h-[400px] rounded-[2.5rem] shadow-2xl border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden"
>
  {#if !map}
    <div class="flex flex-col items-center gap-4">
      <div
        class="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"
      ></div>
      <p class="text-lg text-slate-500 font-bold">地図を読み込み中...</p>
    </div>
  {/if}
</div>
