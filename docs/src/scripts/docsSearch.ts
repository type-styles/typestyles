import MiniSearch from 'minisearch';

type CommandPaletteSlots = Record<string, string>;

type RawDoc = {
  slug: string;
  title: string;
  categoryTitle: string;
  description?: string;
  headings: string[];
  body: string;
};

type Hit = {
  id: string;
  terms: string[];
  title: string;
  body: string;
  headings: string[];
  categoryTitle: string;
  description?: string;
};

const MIN_QUERY_LENGTH = 3;

/** Same-origin path; avoids `new URL(_, BASE_URL)` which throws when BASE_URL is missing or not absolute. */
function searchIndexUrl(): string {
  const raw = import.meta.env.BASE_URL;
  const base = typeof raw === 'string' && raw.length > 0 ? raw : '/';
  return `${base.endsWith('/') ? base : `${base}/`}search-index.json`;
}

const miniSearch = new MiniSearch({
  fields: ['title', 'headingsJoined', 'body', 'description'],
  idField: 'slug',
  storeFields: ['title', 'headings', 'body', 'description', 'categoryTitle'],
  searchOptions: {
    prefix: true,
    boost: { title: 30, headingsJoined: 20, description: 12 },
    combineWith: 'AND',
    fuzzy: true,
  },
});

let indexLoaded = false;
let loadPromise: Promise<void> | null = null;

let teardownDocsSearch: (() => void) | undefined;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightWithTerms(text: string, terms: string[], markClass: string): string {
  const cleaned = [...new Set(terms.map((t) => t.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (!cleaned.length) return escapeHtml(text);
  const re = new RegExp(`(${cleaned.map(escapeRegex).join('|')})`, 'gi');
  return text.replace(re, (m) => `<mark class="${markClass}">${escapeHtml(m)}</mark>`);
}

function readSlotClasses(): { closed: CommandPaletteSlots; open: CommandPaletteSlots } | null {
  const el = document.getElementById('docs-search-slot-classes');
  if (!el?.textContent?.trim()) return null;
  try {
    return JSON.parse(el.textContent) as { closed: CommandPaletteSlots; open: CommandPaletteSlots };
  } catch {
    return null;
  }
}

async function ensureIndex(): Promise<void> {
  if (indexLoaded) return;
  if (!loadPromise) {
    loadPromise = fetch(searchIndexUrl())
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<RawDoc[]>;
      })
      .then((docs) => {
        miniSearch.addAll(
          docs.map((d) => ({
            slug: d.slug,
            title: d.title,
            headings: d.headings,
            headingsJoined: d.headings.join(' '),
            body: d.body,
            description: d.description ?? '',
            categoryTitle: d.categoryTitle ?? 'Documentation',
          })),
        );
        indexLoaded = true;
      })
      .catch((err) => {
        console.error('Docs search: failed to load index', err);
        loadPromise = null;
      });
  }
  await loadPromise;
}

function bindPalette(): (() => void) | undefined {
  const paletteRoot = document.getElementById('docs-search-palette-root');
  const backdropEl = document.getElementById('docs-search-palette-backdrop');
  const dialogEl = document.getElementById('docs-search-palette-dialog');
  const inputEl = document.getElementById('docs-palette-input') as HTMLInputElement | null;
  const listEl = document.getElementById('docs-palette-results');
  const triggerEls = document.querySelectorAll<HTMLElement>('[data-docs-search-trigger]');
  if (!paletteRoot || !backdropEl || !dialogEl || !inputEl || !listEl) return undefined;

  const parsed = readSlotClasses();
  if (!parsed) return undefined;
  const slotsClosed = parsed.closed;
  const slotsOpen = parsed.open;
  let previousActiveElement: Element | null = null;
  let activeIndex = -1;
  let paletteOpen = false;
  let listboxOpen = false;

  function setListboxOpen(open: boolean): void {
    listboxOpen = open;
    inputEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function renderHint(): void {
    listEl.innerHTML = `<li class="${slotsClosed.empty}">Type at least ${MIN_QUERY_LENGTH} characters to search.</li>`;
    setListboxOpen(false);
  }

  function renderEmpty(message: string): void {
    listEl.innerHTML = `<li class="${slotsClosed.empty}">${escapeHtml(message)}</li>`;
    setListboxOpen(false);
  }

  function renderResults(results: Hit[]): void {
    if (!results.length) {
      renderEmpty('No results');
      return;
    }
    listEl.innerHTML = results
      .map((r, i) => {
        const titleHtml = highlightWithTerms(r.title, r.terms, slotsClosed.mark);
        const metaHtml = highlightWithTerms(r.categoryTitle, r.terms, slotsClosed.mark);
        const active = i === activeIndex ? ` ${slotsClosed.resultLinkActive}` : '';
        return `<li class="${slotsClosed.result}" role="none"><a role="option" aria-selected="${i === activeIndex}" tabindex="-1" class="${slotsClosed.resultLink}${active}" href="${escapeHtml(r.id)}"><span class="${slotsClosed.resultTitle}">${titleHtml}</span><span class="${slotsClosed.resultMeta}">${metaHtml}</span></a></li>`;
      })
      .join('');
    setListboxOpen(true);
  }

  function search(): void {
    const q = inputEl.value.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      renderHint();
      activeIndex = -1;
      return;
    }
    if (!indexLoaded) {
      void ensureIndex().then(() => search());
      return;
    }
    const raw = miniSearch.search(q) as unknown as Hit[];
    activeIndex = raw.length ? 0 : -1;
    renderResults(raw);
    syncAriaSelected();
  }

  function syncAriaSelected(): void {
    listEl.querySelectorAll<HTMLElement>('[role="option"]').forEach((el, i) => {
      el.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
    });
  }

  function updateActiveVisual(): void {
    const links = listEl.querySelectorAll<HTMLAnchorElement>('[role="option"]');
    links.forEach((a, i) => {
      const on = i === activeIndex;
      a.className = on
        ? `${slotsClosed.resultLink} ${slotsClosed.resultLinkActive}`
        : slotsClosed.resultLink;
    });
    syncAriaSelected();
  }

  function focusPaletteInput(): void {
    inputEl.focus({ preventScroll: true });
  }

  function openPalette(): void {
    if (paletteOpen) return;
    paletteOpen = true;
    previousActiveElement = document.activeElement;
    paletteRoot.className = slotsOpen.root;
    dialogEl.className = slotsOpen.dialog;
    paletteRoot.setAttribute('aria-hidden', 'false');
    dialogEl.setAttribute('aria-modal', 'true');
    document.body.style.overflow = 'hidden';
    inputEl.value = '';
    activeIndex = -1;

    void ensureIndex().then(() => {
      renderHint();
      focusPaletteInput();
    });

    // After ⌘K, focus in the same tick as keydown is unreliable; wait for dialog paint too.
    setTimeout(focusPaletteInput, 0);
    requestAnimationFrame(() => {
      requestAnimationFrame(focusPaletteInput);
    });
  }

  function closePalette(): void {
    if (!paletteOpen) return;
    paletteOpen = false;
    paletteRoot.className = slotsClosed.root;
    dialogEl.className = slotsClosed.dialog;
    paletteRoot.setAttribute('aria-hidden', 'true');
    dialogEl.removeAttribute('aria-modal');
    document.body.style.overflow = '';
    listEl.innerHTML = '';
    inputEl.value = '';
    activeIndex = -1;
    setListboxOpen(false);
    if (previousActiveElement instanceof HTMLElement) {
      previousActiveElement.focus();
    }
    previousActiveElement = null;
  }

  const onBackdropClick = (): void => closePalette();
  const onTriggerClick = (e: Event): void => {
    e.preventDefault();
    openPalette();
  };
  const onInput = (): void => {
    activeIndex = -1;
    search();
  };
  const onInputKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
      return;
    }
    if (!listboxOpen || !listEl.querySelector('[role="option"]')) return;
    const options = listEl.querySelectorAll<HTMLAnchorElement>('[role="option"]');
    const n = options.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (n === 0) return;
      activeIndex = activeIndex < n - 1 ? activeIndex + 1 : 0;
      updateActiveVisual();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (n === 0) return;
      activeIndex = activeIndex > 0 ? activeIndex - 1 : n - 1;
      updateActiveVisual();
    } else if (e.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
      e.preventDefault();
      options[activeIndex].click();
    }
  };

  const onDocKeydown = (e: KeyboardEvent): void => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      const t = e.target as Node;
      if (paletteOpen && dialogEl.contains(t)) {
        e.preventDefault();
        closePalette();
        return;
      }
      if (!paletteOpen) {
        e.preventDefault();
        openPalette();
      }
    }
  };

  const onAstroPageLoad = (): void => {
    if (paletteOpen) closePalette();
  };

  backdropEl.addEventListener('click', onBackdropClick);
  triggerEls.forEach((el) => el.addEventListener('click', onTriggerClick));
  inputEl.addEventListener('input', onInput);
  inputEl.addEventListener('keydown', onInputKeydown);
  document.addEventListener('keydown', onDocKeydown);
  document.addEventListener('astro:page-load', onAstroPageLoad);

  return () => {
    backdropEl.removeEventListener('click', onBackdropClick);
    triggerEls.forEach((el) => el.removeEventListener('click', onTriggerClick));
    inputEl.removeEventListener('input', onInput);
    inputEl.removeEventListener('keydown', onInputKeydown);
    document.removeEventListener('keydown', onDocKeydown);
    document.removeEventListener('astro:page-load', onAstroPageLoad);
    if (paletteOpen) {
      paletteRoot.className = slotsClosed.root;
      dialogEl.className = slotsClosed.dialog;
      paletteRoot.setAttribute('aria-hidden', 'true');
      dialogEl.removeAttribute('aria-modal');
      document.body.style.overflow = '';
    }
  };
}

export function initDocsSearch(): void {
  teardownDocsSearch?.();
  teardownDocsSearch = bindPalette();
}
