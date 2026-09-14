import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export type PlaygroundUrlState = {
  code?: string;
  preset?: string;
};

/** Compress editor source for the `code` query param. */
export function encodePlaygroundCode(source: string): string {
  return compressToEncodedURIComponent(source);
}

/** Decode a `code` query param. Returns null if empty or corrupt. */
export function decodePlaygroundCode(encoded: string | null | undefined): string | null {
  if (!encoded) return null;
  try {
    const decoded = decompressFromEncodedURIComponent(encoded);
    return decoded && decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/** Read playground state from the current URL search params. */
export function readPlaygroundUrlState(search = window.location.search): PlaygroundUrlState {
  const params = new URLSearchParams(search);
  const code = decodePlaygroundCode(params.get('code'));
  const preset = params.get('preset')?.trim() || undefined;
  return {
    code: code ?? undefined,
    preset,
  };
}

/**
 * Update the URL via `history.replaceState` without a navigation.
 * Pass `code` for custom source, or `preset` for a named template.
 */
export function writePlaygroundUrlState(state: PlaygroundUrlState): void {
  const url = new URL(window.location.href);
  if (state.code) {
    url.searchParams.set('code', encodePlaygroundCode(state.code));
    url.searchParams.delete('preset');
  } else if (state.preset) {
    url.searchParams.set('preset', state.preset);
    url.searchParams.delete('code');
  } else {
    url.searchParams.delete('code');
    url.searchParams.delete('preset');
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, '', next);
  }
}

/** Build a shareable absolute URL for the current playground state. */
export function buildShareUrl(state: PlaygroundUrlState): string {
  const url = new URL(window.location.href);
  if (state.code) {
    url.searchParams.set('code', encodePlaygroundCode(state.code));
    url.searchParams.delete('preset');
  } else if (state.preset) {
    url.searchParams.set('preset', state.preset);
    url.searchParams.delete('code');
  }
  return url.toString();
}
