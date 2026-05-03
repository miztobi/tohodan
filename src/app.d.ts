// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
  interface Window {
    google: {
      maps: any;
    };
  }

  // 簡易的な型定義（コンパイルエラー回避用）
  namespace google {
    namespace maps {
      class Map {}
      class Marker {}
      class InfoWindow {}
      class Polyline {}
      namespace marker {
        class AdvancedMarkerElement {}
      }
    }
  }
}

export {};
