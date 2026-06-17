const LIVE_DEMO_RE = /<!--\s*doc-live-demo\s+id="([^"]+)"\s*-->/g;

/** Marker divs replaced with `<LiveDemo />` islands in `[slug].astro`. */
export function expandLiveDemos(markdown: string): string {
  return markdown.replace(
    LIVE_DEMO_RE,
    (_full, id: string) => `\n\n<div data-doc-live-demo="${id}"></div>\n\n`,
  );
}

export type DocContentPart = { type: 'html'; html: string } | { type: 'live-demo'; id: string };

const SLOT_RE = /<div data-doc-live-demo="([^"]+)"><\/div>/g;

/** Split rendered doc HTML into prose chunks and live-demo slot ids. */
export function splitDocContentParts(html: string): DocContentPart[] {
  const parts: DocContentPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(SLOT_RE.source, SLOT_RE.flags);

  while ((match = re.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'html', html: html.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'live-demo', id: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    parts.push({ type: 'html', html: html.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'html', html }];
}
