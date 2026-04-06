import { button, card, layout, spinner } from './styles';

const app = globalThis.document.getElementById('app');

if (!app) {
  throw new Error('Missing #app root element.');
}

app.innerHTML = `
  <div class="${layout.page}">
    <h1 class="${layout.title}">typestyles + Rollup</h1>
    <p class="${layout.subtitle}">
      Build mode emits static CSS with no runtime style insertion.
    </p>

    <div class="${layout.row}">
      <button class="${button({ hover: true })}">Primary button</button>
      <div class="${spinner()}" title="Loading"></div>
    </div>

    <div class="${card()}">
      This card is animated using keyframes emitted to <code>typestyles.css</code>.
    </div>
  </div>
`;
