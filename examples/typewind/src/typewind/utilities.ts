import type { CSSProperties } from 'typestyles';
import { brand, slate, space } from './theme';
import { styles } from './runtime';

const s = space;
const c = slate;
const b = brand;

const utilLayer = { layer: 'utilities' } as const;

function u(name: string, properties: CSSProperties): string {
  return styles.class(name, properties, utilLayer);
}

/* —— Display —— */
export const block = u('block', { display: 'block' });
export const inlineBlock = u('inline-block', { display: 'inline-block' });
export const inline = u('inline', { display: 'inline' });
export const flex = u('flex', { display: 'flex' });
export const inlineFlex = u('inline-flex', { display: 'inline-flex' });
export const grid = u('grid', { display: 'grid' });
export const hidden = u('hidden', { display: 'none' });

/* —— Flex direction —— */
export const flexRow = u('flex-row', { flexDirection: 'row' });
export const flexCol = u('flex-col', { flexDirection: 'column' });
export const flexWrap = u('flex-wrap', { flexWrap: 'wrap' });

/* —— Align / justify —— */
export const itemsStart = u('items-start', { alignItems: 'flex-start' });
export const itemsCenter = u('items-center', { alignItems: 'center' });
export const itemsEnd = u('items-end', { alignItems: 'flex-end' });
export const itemsStretch = u('items-stretch', { alignItems: 'stretch' });
export const justifyStart = u('justify-start', { justifyContent: 'flex-start' });
export const justifyCenter = u('justify-center', { justifyContent: 'center' });
export const justifyEnd = u('justify-end', { justifyContent: 'flex-end' });
export const justifyBetween = u('justify-between', { justifyContent: 'space-between' });
export const justifyAround = u('justify-around', { justifyContent: 'space-around' });

/* —— Gap —— */
export const gap1 = u('gap-1', { gap: s['1'] });
export const gap2 = u('gap-2', { gap: s['2'] });
export const gap3 = u('gap-3', { gap: s['3'] });
export const gap4 = u('gap-4', { gap: s['4'] });
export const gap6 = u('gap-6', { gap: s['6'] });
export const gap8 = u('gap-8', { gap: s['8'] });

/* —— Padding —— */
export const p0 = u('p-0', { padding: s['0'] });
export const p2 = u('p-2', { padding: s['2'] });
export const p4 = u('p-4', { padding: s['4'] });
export const p6 = u('p-6', { padding: s['6'] });
export const p8 = u('p-8', { padding: s['8'] });
export const px4 = u('px-4', { paddingLeft: s['4'], paddingRight: s['4'] });
export const py2 = u('py-2', { paddingTop: s['2'], paddingBottom: s['2'] });
export const py3 = u('py-3', { paddingTop: s['3'], paddingBottom: s['3'] });
export const py8 = u('py-8', { paddingTop: s['8'], paddingBottom: s['8'] });
export const pt4 = u('pt-4', { paddingTop: s['4'] });

/* —— Margin —— */
export const m0 = u('m-0', { margin: s['0'] });
export const mxAuto = u('mx-auto', { marginLeft: 'auto', marginRight: 'auto' });
export const mt2 = u('mt-2', { marginTop: s['2'] });
export const mt4 = u('mt-4', { marginTop: s['4'] });
export const mb2 = u('mb-2', { marginBottom: s['2'] });
export const mb4 = u('mb-4', { marginBottom: s['4'] });

/* —— Width / max-width —— */
export const wFull = u('w-full', { width: '100%' });
export const w10 = u('w-10', { width: s['10'] });
export const h10 = u('h-10', { height: s['10'] });
export const minHScreen = u('min-h-screen', { minHeight: '100vh' });
export const shrink0 = u('shrink-0', { flexShrink: 0 });
export const maxWsm = u('max-w-sm', { maxWidth: '24rem' });
export const maxWmd = u('max-w-md', { maxWidth: '28rem' });
export const maxWlg = u('max-w-lg', { maxWidth: '32rem' });
export const maxWxl = u('max-w-xl', { maxWidth: '36rem' });
export const maxW2xl = u('max-w-2xl', { maxWidth: '42rem' });
export const maxW3xl = u('max-w-3xl', { maxWidth: '48rem' });

/* —— Typography —— */
export const textXs = u('text-xs', { fontSize: '0.75rem', lineHeight: '1rem' });
export const textSm = u('text-sm', { fontSize: '0.875rem', lineHeight: '1.25rem' });
export const textBase = u('text-base', { fontSize: '1rem', lineHeight: '1.5rem' });
export const textLg = u('text-lg', { fontSize: '1.125rem', lineHeight: '1.75rem' });
export const textXl = u('text-xl', { fontSize: '1.25rem', lineHeight: '1.75rem' });
export const text2xl = u('text-2xl', { fontSize: '1.5rem', lineHeight: '2rem' });
export const text3xl = u('text-3xl', { fontSize: '1.875rem', lineHeight: '2.25rem' });
export const fontMedium = u('font-medium', { fontWeight: 500 });
export const fontSemibold = u('font-semibold', { fontWeight: 600 });
export const fontBold = u('font-bold', { fontWeight: 700 });
export const trackingTight = u('tracking-tight', { letterSpacing: '-0.025em' });
export const trackingWide = u('tracking-wide', { letterSpacing: '0.05em' });
export const uppercase = u('uppercase', { textTransform: 'uppercase' });
export const textCenter = u('text-center', { textAlign: 'center' });
export const textLeft = u('text-left', { textAlign: 'left' });

/* —— Colors (text) —— */
export const textSlate400 = u('text-slate-400', { color: c['400'] });
export const textSlate500 = u('text-slate-500', { color: c['500'] });
export const textSlate600 = u('text-slate-600', { color: c['600'] });
export const textSlate700 = u('text-slate-700', { color: c['700'] });
export const textSlate800 = u('text-slate-800', { color: c['800'] });
export const textSlate900 = u('text-slate-900', { color: c['900'] });
export const textWhite = u('text-white', { color: '#fff' });

/* —— Backgrounds —— */
export const bgWhite = u('bg-white', { backgroundColor: '#fff' });
export const bgSlate50 = u('bg-slate-50', { backgroundColor: c['50'] });
export const bgSlate100 = u('bg-slate-100', { backgroundColor: c['100'] });
export const bgSlate700 = u('bg-slate-700', { backgroundColor: c['700'] });
export const bgSlate800 = u('bg-slate-800', { backgroundColor: c['800'] });
export const bgSlate900 = u('bg-slate-900', { backgroundColor: c['900'] });
export const bgBrand500 = u('bg-brand-500', { backgroundColor: b['500'] });
export const bgBrand600 = u('bg-brand-600', { backgroundColor: b['600'] });

/* —— Borders —— */
export const border = u('border', { borderWidth: '1px', borderStyle: 'solid' });
export const borderSlate200 = u('border-slate-200', { borderColor: c['200'] });
export const borderSlate600 = u('border-slate-600', { borderColor: c['600'] });
export const borderSlate700 = u('border-slate-700', { borderColor: c['700'] });
export const rounded = u('rounded', { borderRadius: '0.25rem' });
export const roundedMd = u('rounded-md', { borderRadius: '0.375rem' });
export const roundedLg = u('rounded-lg', { borderRadius: '0.5rem' });
export const roundedXl = u('rounded-xl', { borderRadius: '0.75rem' });
export const roundedFull = u('rounded-full', { borderRadius: '9999px' });

/* —— Shadow —— */
export const shadow = u('shadow', {
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
});
export const shadowMd = u('shadow-md', {
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
});
export const shadowLg = u('shadow-lg', {
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
});

/* —— Misc —— */
export const overflowHidden = u('overflow-hidden', { overflow: 'hidden' });
export const listNone = u('list-none', { listStyle: 'none', padding: 0, margin: 0 });
export const underline = u('underline', { textDecoration: 'underline' });
export const antialiased = u('antialiased', { WebkitFontSmoothing: 'antialiased' });

/* —— Transitions (subset) —— */
export const transitionColors = u('transition-colors', {
  transitionProperty: 'color, background-color, border-color',
  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  transitionDuration: '150ms',
});

/* —— Interactive button-ish —— */
export const cursorPointer = u('cursor-pointer', { cursor: 'pointer' });
export const ringOffset2 = u('ring-offset-2', { outlineOffset: '2px' });

export const focusRing = u('focus-ring', {
  outline: '2px solid transparent',
  outlineOffset: '2px',
  '&:focus-visible': {
    outline: `2px solid ${b['500']}`,
    outlineOffset: '2px',
  },
});

/** `sm:flex-row` — responsive row at ≥640px. */
export const smFlexRow = u('sm-flex-row', {
  '@media (min-width: 640px)': { flexDirection: 'row' },
});
