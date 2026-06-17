import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import typestyles from '@typestyles/vite';

export default defineConfig({
  plugins: [vue(), typestyles()],
});
