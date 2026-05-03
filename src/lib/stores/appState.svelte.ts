export class AppState {
  currentCoords = $state<[number, number] | null>(null);
  progress = $state<number>(0);
  isTracking = $state<boolean>(false);
  error = $state<string | null>(null);
  lastUpdated = $state<Date | null>(null);
  currentTime = $state<Date>(new Date());
  progressMode = $state<"total" | "segment">("total");

  updateLocation(coords: [number, number], newProgress: number) {
    this.currentCoords = coords;
    this.progress = newProgress;
    this.lastUpdated = new Date();
  }

  toggleProgressMode() {
    this.progressMode = this.progressMode === "total" ? "segment" : "total";
  }

  setTracking(status: boolean) {
    this.isTracking = status;
  }

  setError(msg: string | null) {
    this.error = msg;
  }
}

export const appState = new AppState();
