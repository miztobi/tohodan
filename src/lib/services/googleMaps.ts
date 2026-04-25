import { browser } from '$app/environment';

export async function loadMapLibrary() {
  if (!browser) return null;
  
  // HTML側（+layout.svelte）で読み込まれるのを待つ
  return new Promise((resolve) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    // まだ読み込まれていない場合は、定期的にチェック
    const checkInterval = setInterval(() => {
      if (window.google && window.google.maps) {
        clearInterval(checkInterval);
        resolve(window.google.maps);
      }
    }, 100);

    // 10秒待ってダメなら諦める
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(null);
    }, 10000);
  });
}

export async function loadMarkerLibrary() {
  // すでにlibraries=maps,markerで読み込んでいるので同じものを返す
  return loadMapLibrary(); 
}
