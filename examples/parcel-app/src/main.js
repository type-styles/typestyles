import { heading } from './styles.js';

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app');

app.innerHTML = `<h1 class="${heading()}">typestyles + Parcel (runtime)</h1>`;
