import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import typestyles from '@typestyles/vite';

export default defineConfig({
  plugins: [svelte(), typestyles()],
});
