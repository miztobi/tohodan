<script lang="ts">
  import { onMount } from 'svelte';
  import { loginAnonymously, watchAuthState } from '$lib/services/auth';
  import { appState } from '$lib/stores/appState.svelte';
  import './layout.css';

  let { children } = $props();

  onMount(() => {
    // 1. 匿名ログインの実行
    loginAnonymously().catch(err => {
      appState.setError('ログインに失敗しました。');
    });

    // 2. 認証状態の監視
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

<div class="antialiased text-slate-900 bg-white">
  {@render children()}
</div>
