import './typestyles-entry.js';
import { styles } from 'typestyles';

const title = styles.component('esbuild-title', {
  base: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '8px',
  },
});

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app');

app.innerHTML = `<h1 class="${title()}">typestyles + esbuild</h1>`;
