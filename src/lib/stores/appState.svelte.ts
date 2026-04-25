export class AppState {
  currentCoords = $state<[number, number] | null>(null);
  progress = $state<number>(0);
  isTracking = $state<boolean>(false);
  error = $state<string | null>(null);

  updateLocation(coords: [number, number], newProgress: number) {
    this.currentCoords = coords;
    this.progress = newProgress;
  }

  setTracking(status: boolean) {
    this.isTracking = status;
  }

  setError(msg: string | null) {
    this.error = msg;
  }
}

export const appState = new AppState();
