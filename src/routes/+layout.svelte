<script lang="ts">
  import { onMount } from 'svelte';
  import { loginAnonymously, watchAuthState } from '$lib/services/auth';
  import { appState } from '$lib/stores/appState.svelte';
  import './layout.css';

  // +layout.server.ts から渡されるデータ
  let { data, children } = $props();

  onMount(() => {
    loginAnonymously().catch(err => {
      appState.setError('ログインに失敗しました。');
    });

    const unsubscribe = watchAuthState((user) => {
      if (user) {
        console.log('User signed in:', user.uid);
      } else {
        console.log('User signed out');
      }
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  <!-- テストHTMLで成功した方式をそのまま再現 -->
  {#if data?.googleMapsApiKey}
    <script 
      src="https://maps.googleapis.com/maps/api/js?key={data.googleMapsApiKey}&loading=async&libraries=maps,marker&v=weekly" 
      async 
      defer
    ></script>
  {/if}
</svelte:head>

<div class="antialiased text-slate-900 bg-white">
  {@render children()}
</div>
