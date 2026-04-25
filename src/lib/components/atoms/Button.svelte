<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    disabled?: boolean;
    onclick?: () => void;
    children: Snippet;
    class?: string;
  }

  let { 
    type = 'button', 
    variant = 'primary', 
    disabled = false, 
    onclick, 
    children,
    class: className = ''
  }: Props = $props();

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="px-6 py-4 rounded-2xl font-bold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed {variants[variant]} {className}"
>
  {@render children()}
</button>
