<script lang="ts">
  import { X, ExternalLink, Phone, Info } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();
</script>

{#if isOpen}
  <!-- 背景オーバーレイ -->
  <button 
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] w-full h-full border-none cursor-default"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    aria-label="Close menu"
    transition:fade={{ duration: 200 }}
  ></button>

  <!-- モーダルコンテンツ -->
  <div 
    class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[1001] p-8 pb-12"
    transition:fly={{ y: 300, duration: 300 }}
  >
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-slate-100 rounded-xl">
          <Info size={24} class="text-slate-600" />
        </div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">メニュー / 情報</h2>
      </div>
      <button 
        onclick={onClose}
        class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
      >
        <X size={28} />
      </button>
    </div>

    <div class="space-y-4">
      <!-- 青年会髙安分会のページ -->
      <a 
        href="https://takayasuseinenkai.com/" 
        target="_blank" 
        rel="noopener noreferrer"
        class="flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all group"
      >
        <span class="font-bold text-slate-700 text-lg">青年会髙安分会のページ</span>
        <ExternalLink size={20} class="text-slate-300 group-hover:text-blue-500 transition-colors" />
      </a>

      <!-- 御臨席総会の特設ページ -->
      <a 
        href="https://goriseki1129.web.app" 
        target="_blank" 
        rel="noopener noreferrer"
        class="flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all group"
      >
        <span class="font-bold text-slate-700 text-lg">御臨席総会の特設ページ</span>
        <ExternalLink size={20} class="text-slate-300 group-hover:text-blue-500 transition-colors" />
      </a>

      <!-- 係員に電話 -->
      <a 
        href="tel:080-3825-6689" 
        class="flex items-center gap-4 p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
      >
        <div class="p-3 bg-white/20 rounded-xl">
          <Phone size={24} fill="currentColor" />
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-bold uppercase tracking-wider opacity-80">Emergency Contact</span>
          <span class="text-xl font-black">係員に電話する</span>
        </div>
      </a>
    </div>

    <p class="text-center mt-10 text-slate-300 text-sm font-bold tracking-widest uppercase">
      tohodan walk support
    </p>
  </div>
{/if}
