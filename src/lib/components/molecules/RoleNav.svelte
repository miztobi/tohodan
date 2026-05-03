<script lang="ts">
  import { Menu } from 'lucide-svelte';

  interface Props {
    onMenuClick: () => void;
  }

  let { onMenuClick }: Props = $props();
</script>

<div class="flex items-center gap-2">
  <div class="flex items-center bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
    <a href="/staff" class="px-2 py-1.5 text-[10px] font-black rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">ス</a>
    <a href="/head" class="px-2 py-1.5 text-[10px] font-black rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">先</a>
    <a href="/tail" class="px-2 py-1.5 text-[10px] font-black rounded-xl hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors">尾</a>
  </div>
  <button 
    onclick={onMenuClick}
    class="p-2.5 bg-white text-slate-600 hover:text-blue-600 rounded-2xl shadow-sm border border-slate-100 transition-colors"
  >
    <Menu size={24} />
  </button>
</div>
