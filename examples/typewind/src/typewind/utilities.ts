import { styles } from 'typestyles';
import { brand, slate, space } from './theme';

const s = space;
const c = slate;
const b = brand;

/* —— Display —— */
export const block = styles.class('block', { display: 'block' });
export const inlineBlock = styles.class('inline-block', { display: 'inline-block' });
export const inline = styles.class('inline', { display: 'inline' });
export const flex = styles.class('flex', { display: 'flex' });
export const inlineFlex = styles.class('inline-flex', { display: 'inline-flex' });
export const grid = styles.class('grid', { display: 'grid' });
export const hidden = styles.class('hidden', { display: 'none' });

/* —— Flex direction —— */
export const flexRow = styles.class('flex-row', { flexDirection: 'row' });
export const flexCol = styles.class('flex-col', { flexDirection: 'column' });
export const flexWrap = styles.class('flex-wrap', { flexWrap: 'wrap' });

/* —— Align / justify —— */
export const itemsStart = styles.class('items-start', { alignItems: 'flex-start' });
export const itemsCenter = styles.class('items-center', { alignItems: 'center' });
export const itemsEnd = styles.class('items-end', { alignItems: 'flex-end' });
export const itemsStretch = styles.class('items-stretch', { alignItems: 'stretch' });
export const justifyStart = styles.class('justify-start', { justifyContent: 'flex-start' });
export const justifyCenter = styles.class('justify-center', { justifyContent: 'center' });
export const justifyEnd = styles.class('justify-end', { justifyContent: 'flex-end' });
export const justifyBetween = styles.class('justify-between', { justifyContent: 'space-between' });
export const justifyAround = styles.class('justify-around', { justifyContent: 'space-around' });

/* —— Gap —— */
export const gap1 = styles.class('gap-1', { gap: s['1'] });
export const gap2 = styles.class('gap-2', { gap: s['2'] });
export const gap3 = styles.class('gap-3', { gap: s['3'] });
export const gap4 = styles.class('gap-4', { gap: s['4'] });
export const gap6 = styles.class('gap-6', { gap: s['6'] });
export const gap8 = styles.class('gap-8', { gap: s['8'] });

/* —— Padding —— */
export const p0 = styles.class('p-0', { padding: s['0'] });
export const p2 = styles.class('p-2', { padding: s['2'] });
export const p4 = styles.class('p-4', { padding: s['4'] });
export const p6 = styles.class('p-6', { padding: s['6'] });
export const p8 = styles.class('p-8', { padding: s['8'] });
export const px4 = styles.class('px-4', { paddingLeft: s['4'], paddingRight: s['4'] });
export const py2 = styles.class('py-2', { paddingTop: s['2'], paddingBottom: s['2'] });
export const py3 = styles.class('py-3', { paddingTop: s['3'], paddingBottom: s['3'] });
export const py8 = styles.class('py-8', { paddingTop: s['8'], paddingBottom: s['8'] });
export const pt4 = styles.class('pt-4', { paddingTop: s['4'] });

/* —— Margin —— */
export const m0 = styles.class('m-0', { margin: s['0'] });
export const mxAuto = styles.class('mx-auto', { marginLeft: 'auto', marginRight: 'auto' });
export const mt2 = styles.class('mt-2', { marginTop: s['2'] });
export const mt4 = styles.class('mt-4', { marginTop: s['4'] });
export const mb2 = styles.class('mb-2', { marginBottom: s['2'] });
export const mb4 = styles.class('mb-4', { marginBottom: s['4'] });

/* —— Width / max-width —— */
export const wFull = styles.class('w-full', { width: '100%' });
export const w10 = styles.class('w-10', { width: s['10'] });
export const h10 = styles.class('h-10', { height: s['10'] });
export const minHScreen = styles.class('min-h-screen', { minHeight: '100vh' });
export const shrink0 = styles.class('shrink-0', { flexShrink: 0 });
export const maxWsm = styles.class('max-w-sm', { maxWidth: '24rem' });
export const maxWmd = styles.class('max-w-md', { maxWidth: '28rem' });
export const maxWlg = styles.class('max-w-lg', { maxWidth: '32rem' });
export const maxWxl = styles.class('max-w-xl', { maxWidth: '36rem' });
export const maxW2xl = styles.class('max-w-2xl', { maxWidth: '42rem' });
export const maxW3xl = styles.class('max-w-3xl', { maxWidth: '48rem' });

/* —— Typography —— */
export const textXs = styles.class('text-xs', { fontSize: '0.75rem', lineHeight: '1rem' });
export const textSm = styles.class('text-sm', { fontSize: '0.875rem', lineHeight: '1.25rem' });
export const textBase = styles.class('text-base', { fontSize: '1rem', lineHeight: '1.5rem' });
export const textLg = styles.class('text-lg', { fontSize: '1.125rem', lineHeight: '1.75rem' });
export const textXl = styles.class('text-xl', { fontSize: '1.25rem', lineHeight: '1.75rem' });
export const text2xl = styles.class('text-2xl', { fontSize: '1.5rem', lineHeight: '2rem' });
export const text3xl = styles.class('text-3xl', { fontSize: '1.875rem', lineHeight: '2.25rem' });
export const fontMedium = styles.class('font-medium', { fontWeight: 500 });
export const fontSemibold = styles.class('font-semibold', { fontWeight: 600 });
export const fontBold = styles.class('font-bold', { fontWeight: 700 });
export const trackingTight = styles.class('tracking-tight', { letterSpacing: '-0.025em' });
export const trackingWide = styles.class('tracking-wide', { letterSpacing: '0.05em' });
export const uppercase = styles.class('uppercase', { textTransform: 'uppercase' });
export const textCenter = styles.class('text-center', { textAlign: 'center' });
export const textLeft = styles.class('text-left', { textAlign: 'left' });

/* —— Colors (text) —— */
export const textSlate400 = styles.class('text-slate-400', { color: c['400'] });
export const textSlate500 = styles.class('text-slate-500', { color: c['500'] });
export const textSlate600 = styles.class('text-slate-600', { color: c['600'] });
export const textSlate700 = styles.class('text-slate-700', { color: c['700'] });
export const textSlate800 = styles.class('text-slate-800', { color: c['800'] });
export const textSlate900 = styles.class('text-slate-900', { color: c['900'] });
export const textWhite = styles.class('text-white', { color: '#fff' });

/* —— Backgrounds —— */
export const bgWhite = styles.class('bg-white', { backgroundColor: '#fff' });
export const bgSlate50 = styles.class('bg-slate-50', { backgroundColor: c['50'] });
export const bgSlate100 = styles.class('bg-slate-100', { backgroundColor: c['100'] });
export const bgSlate700 = styles.class('bg-slate-700', { backgroundColor: c['700'] });
export const bgSlate800 = styles.class('bg-slate-800', { backgroundColor: c['800'] });
export const bgSlate900 = styles.class('bg-slate-900', { backgroundColor: c['900'] });
export const bgBrand500 = styles.class('bg-brand-500', { backgroundColor: b['500'] });
export const bgBrand600 = styles.class('bg-brand-600', { backgroundColor: b['600'] });

/* —— Borders —— */
export const border = styles.class('border', { borderWidth: '1px', borderStyle: 'solid' });
export const borderSlate200 = styles.class('border-slate-200', { borderColor: c['200'] });
export const borderSlate600 = styles.class('border-slate-600', { borderColor: c['600'] });
export const borderSlate700 = styles.class('border-slate-700', { borderColor: c['700'] });
export const rounded = styles.class('rounded', { borderRadius: '0.25rem' });
export const roundedMd = styles.class('rounded-md', { borderRadius: '0.375rem' });
export const roundedLg = styles.class('rounded-lg', { borderRadius: '0.5rem' });
export const roundedXl = styles.class('rounded-xl', { borderRadius: '0.75rem' });
export const roundedFull = styles.class('rounded-full', { borderRadius: '9999px' });

/* —— Shadow —— */
export const shadow = styles.class('shadow', {
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
});
export const shadowMd = styles.class('shadow-md', {
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
});
export const shadowLg = styles.class('shadow-lg', {
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
});

/* —— Misc —— */
export const overflowHidden = styles.class('overflow-hidden', { overflow: 'hidden' });
export const listNone = styles.class('list-none', { listStyle: 'none', padding: 0, margin: 0 });
export const underline = styles.class('underline', { textDecoration: 'underline' });
export const antialiased = styles.class('antialiased', { WebkitFontSmoothing: 'antialiased' });

/* —— Transitions (subset) —— */
export const transitionColors = styles.class('transition-colors', {
  transitionProperty: 'color, background-color, border-color',
  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  transitionDuration: '150ms',
});

/* —— Interactive button-ish —— */
export const cursorPointer = styles.class('cursor-pointer', { cursor: 'pointer' });
export const ringOffset2 = styles.class('ring-offset-2', { outlineOffset: '2px' });

export const focusRing = styles.class('focus-ring', {
  outline: '2px solid transparent',
  outlineOffset: '2px',
  '&:focus-visible': {
    outline: `2px solid ${b['500']}`,
    outlineOffset: '2px',
  },
});

/** `sm:flex-row` — responsive row at ≥640px. */
export const smFlexRow = styles.class('sm-flex-row', {
  '@media (min-width: 640px)': { flexDirection: 'row' },
});
