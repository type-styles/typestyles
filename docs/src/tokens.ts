import { tokens, color as c } from 'typestyles';
import {
  codeSyntaxBrandPalettes,
  codeSyntaxDarkValues,
  designColorDarkValues,
} from '@examples/design-system';

const oklch = (l: number, ch: number, h: number) => c.oklch(`${l}%`, ch, h);

export const neutral = {
  1: oklch(99.4, 0.002, 264),
  2: oklch(98.4, 0.003, 264),
  3: oklch(96.5, 0.004, 264),
  4: oklch(93.5, 0.006, 264),
  5: oklch(90.2, 0.008, 264),
  6: oklch(85.6, 0.01, 264),
  7: oklch(77.5, 0.012, 264),
  8: oklch(66.4, 0.014, 264),
  9: oklch(55.1, 0.014, 264),
  10: oklch(45.6, 0.012, 264),
  11: oklch(37.3, 0.01, 264),
  12: oklch(24.8, 0.008, 264),
};

export const primary = {
  1: oklch(98.4, 0.01, 165),
  2: oklch(96.2, 0.03, 166),
  3: oklch(92.3, 0.08, 166.5),
  4: oklch(87.1, 0.13, 167),
  5: oklch(79.8, 0.2, 167.5),
  6: oklch(71.1, 0.26, 168),
  7: oklch(62.2, 0.27, 168.5),
  8: oklch(55.7, 0.24, 170),
  9: oklch(50.2, 0.22, 172),
  10: oklch(45.5, 0.2, 174),
  11: oklch(39.8, 0.16, 175),
  12: oklch(30.5, 0.12, 176),
};

export const red = {
  1: oklch(99.7, 0.008, 25),
  2: oklch(99.2, 0.019, 25.5),
  3: oklch(97.3, 0.045, 26),
  4: oklch(93.5, 0.1, 26.5),
  5: oklch(87.8, 0.16, 27),
  6: oklch(80.3, 0.22, 27.5),
  7: oklch(71.5, 0.24, 28),
  8: oklch(63.5, 0.22, 28.5),
  9: oklch(57.5, 0.18, 29),
  10: oklch(51.5, 0.15, 30),
  11: oklch(41.5, 0.12, 31),
  12: oklch(30.5, 0.1, 32),
};

export const ruby = {
  1: oklch(99.7, 0.008, 25),
  2: oklch(99.2, 0.019, 26),
  3: oklch(97.5, 0.04, 27),
  4: oklch(94.5, 0.08, 28),
  5: oklch(89.5, 0.13, 30),
  6: oklch(82.8, 0.18, 32),
  7: oklch(74.5, 0.22, 34),
  8: oklch(65.8, 0.22, 36),
  9: oklch(58.8, 0.2, 38),
  10: oklch(52.5, 0.18, 40),
  11: oklch(42.5, 0.14, 42),
  12: oklch(32, 0.11, 44),
};

export const tomato = {
  1: oklch(99.7, 0.008, 25),
  2: oklch(99.2, 0.02, 26),
  3: oklch(97.4, 0.05, 27),
  4: oklch(93.8, 0.1, 28),
  5: oklch(88.2, 0.17, 29),
  6: oklch(80.8, 0.24, 30),
  7: oklch(72.2, 0.27, 31),
  8: oklch(63.8, 0.26, 32),
  9: oklch(58, 0.22, 33),
  10: oklch(52.2, 0.18, 35),
  11: oklch(42.5, 0.14, 37),
  12: oklch(31.5, 0.1, 39),
};

export const orange = {
  1: oklch(99.7, 0.008, 40),
  2: oklch(99.2, 0.018, 41),
  3: oklch(97.4, 0.04, 42),
  4: oklch(93.5, 0.09, 43),
  5: oklch(87.5, 0.15, 44),
  6: oklch(79.5, 0.22, 45),
  7: oklch(70.2, 0.26, 46),
  8: oklch(62.2, 0.25, 47),
  9: oklch(56.5, 0.22, 48),
  10: oklch(51, 0.18, 50),
  11: oklch(42, 0.14, 52),
  12: oklch(31.5, 0.1, 55),
};

export const amber = {
  1: oklch(99.5, 0.01, 50),
  2: oklch(99, 0.02, 52),
  3: oklch(97.2, 0.05, 54),
  4: oklch(92.8, 0.1, 56),
  5: oklch(86.2, 0.16, 58),
  6: oklch(77.2, 0.24, 60),
  7: oklch(67.5, 0.28, 62),
  8: oklch(60, 0.26, 64),
  9: oklch(55.5, 0.22, 66),
  10: oklch(50, 0.18, 68),
  11: oklch(41, 0.14, 70),
  12: oklch(30.5, 0.1, 73),
};

export const yellow = {
  1: oklch(99.5, 0.01, 80),
  2: oklch(99, 0.015, 82),
  3: oklch(97.2, 0.04, 85),
  4: oklch(93.2, 0.08, 88),
  5: oklch(87.5, 0.12, 90),
  6: oklch(79.5, 0.18, 92),
  7: oklch(70.8, 0.22, 94),
  8: oklch(64.5, 0.2, 96),
  9: oklch(60.5, 0.18, 98),
  10: oklch(55.5, 0.15, 100),
  11: oklch(45.5, 0.12, 102),
  12: oklch(33, 0.08, 105),
};

export const mint = {
  1: oklch(99.2, 0.01, 170),
  2: oklch(98.2, 0.02, 172),
  3: oklch(96.2, 0.04, 174),
  4: oklch(93.2, 0.08, 176),
  5: oklch(88.5, 0.14, 178),
  6: oklch(81.8, 0.22, 180),
  7: oklch(73.8, 0.26, 182),
  8: oklch(65.8, 0.26, 184),
  9: oklch(60.2, 0.22, 186),
  10: oklch(54.5, 0.18, 188),
  11: oklch(44, 0.14, 190),
  12: oklch(32.5, 0.1, 192),
};

export const jade = {
  1: oklch(99.3, 0.01, 165),
  2: oklch(98.3, 0.02, 167),
  3: oklch(96.3, 0.04, 169),
  4: oklch(93.3, 0.08, 171),
  5: oklch(88.5, 0.13, 173),
  6: oklch(81.8, 0.2, 175),
  7: oklch(73.5, 0.25, 177),
  8: oklch(65.2, 0.25, 179),
  9: oklch(59.5, 0.22, 181),
  10: oklch(53.8, 0.18, 183),
  11: oklch(43.5, 0.14, 185),
  12: oklch(32, 0.1, 187),
};

export const green = {
  1: oklch(99.3, 0.01, 160),
  2: oklch(98.3, 0.02, 162),
  3: oklch(96.3, 0.04, 164),
  4: oklch(93.3, 0.08, 166),
  5: oklch(88.5, 0.13, 168),
  6: oklch(81.5, 0.2, 170),
  7: oklch(73, 0.25, 172),
  8: oklch(64.5, 0.25, 174),
  9: oklch(58.8, 0.22, 176),
  10: oklch(53.2, 0.18, 178),
  11: oklch(43, 0.14, 180),
  12: oklch(31.5, 0.1, 182),
};

export const teal = {
  1: oklch(99, 0.01, 170),
  2: oklch(98, 0.02, 173),
  3: oklch(96, 0.04, 176),
  4: oklch(93, 0.08, 179),
  5: oklch(87.5, 0.13, 182),
  6: oklch(80.2, 0.2, 185),
  7: oklch(71.5, 0.25, 188),
  8: oklch(62.8, 0.25, 191),
  9: oklch(57, 0.22, 194),
  10: oklch(51.5, 0.18, 197),
  11: oklch(42, 0.14, 200),
  12: oklch(30.5, 0.1, 203),
};

export const cyan = {
  1: oklch(99, 0.01, 190),
  2: oklch(98, 0.02, 193),
  3: oklch(96, 0.04, 196),
  4: oklch(92.8, 0.08, 199),
  5: oklch(87, 0.13, 202),
  6: oklch(79.5, 0.2, 205),
  7: oklch(70.5, 0.25, 208),
  8: oklch(61.8, 0.25, 211),
  9: oklch(56, 0.22, 214),
  10: oklch(50.5, 0.18, 217),
  11: oklch(41, 0.14, 220),
  12: oklch(30, 0.1, 223),
};

export const sky = {
  1: oklch(99.2, 0.01, 210),
  2: oklch(98.2, 0.02, 212),
  3: oklch(96.2, 0.04, 214),
  4: oklch(92.8, 0.08, 216),
  5: oklch(87.2, 0.13, 218),
  6: oklch(79.8, 0.2, 220),
  7: oklch(70.8, 0.25, 222),
  8: oklch(62.2, 0.25, 224),
  9: oklch(56.5, 0.22, 226),
  10: oklch(51, 0.18, 228),
  11: oklch(41.5, 0.14, 230),
  12: oklch(30.5, 0.1, 232),
};

export const blue = {
  1: oklch(99.4, 0.008, 240),
  2: oklch(99.2, 0.015, 241),
  3: oklch(97.8, 0.03, 242),
  4: oklch(95, 0.06, 243),
  5: oklch(90, 0.1, 244),
  6: oklch(82.5, 0.16, 245),
  7: oklch(73.5, 0.22, 246),
  8: oklch(64.5, 0.25, 247),
  9: oklch(58.5, 0.22, 248),
  10: oklch(53, 0.18, 249),
  11: oklch(43, 0.14, 250),
  12: oklch(31.5, 0.1, 251),
};

export const indigo = {
  1: oklch(99.4, 0.008, 255),
  2: oklch(99, 0.015, 257),
  3: oklch(97.2, 0.03, 259),
  4: oklch(93.8, 0.06, 261),
  5: oklch(87.8, 0.1, 263),
  6: oklch(79, 0.17, 265),
  7: oklch(69.2, 0.24, 267),
  8: oklch(60.5, 0.26, 269),
  9: oklch(55.2, 0.24, 271),
  10: oklch(50, 0.2, 273),
  11: oklch(41, 0.16, 275),
  12: oklch(30.5, 0.11, 277),
};

export const violet = {
  1: oklch(99.5, 0.008, 265),
  2: oklch(99.2, 0.015, 267),
  3: oklch(97.8, 0.03, 269),
  4: oklch(95, 0.06, 271),
  5: oklch(90, 0.1, 273),
  6: oklch(82.5, 0.16, 275),
  7: oklch(73.5, 0.22, 277),
  8: oklch(64.2, 0.25, 279),
  9: oklch(58.5, 0.22, 281),
  10: oklch(53, 0.18, 283),
  11: oklch(43.2, 0.14, 285),
  12: oklch(32, 0.1, 287),
};

export const purple = {
  1: oklch(99.5, 0.008, 285),
  2: oklch(99.2, 0.015, 287),
  3: oklch(97.5, 0.03, 289),
  4: oklch(94.2, 0.06, 291),
  5: oklch(88.2, 0.1, 293),
  6: oklch(79.5, 0.17, 295),
  7: oklch(69.5, 0.24, 297),
  8: oklch(60, 0.26, 299),
  9: oklch(54.5, 0.24, 301),
  10: oklch(49.2, 0.2, 303),
  11: oklch(40.2, 0.15, 305),
  12: oklch(30, 0.11, 307),
};

export const plum = {
  1: oklch(99.5, 0.008, 295),
  2: oklch(99.2, 0.015, 297),
  3: oklch(97.5, 0.03, 299),
  4: oklch(94.2, 0.06, 301),
  5: oklch(88.2, 0.1, 303),
  6: oklch(79.5, 0.17, 305),
  7: oklch(69.5, 0.24, 307),
  8: oklch(59.8, 0.26, 309),
  9: oklch(54.2, 0.24, 311),
  10: oklch(48.8, 0.2, 313),
  11: oklch(39.5, 0.15, 315),
  12: oklch(29.2, 0.1, 317),
};

export const pink = {
  1: oklch(99.6, 0.008, 330),
  2: oklch(99.3, 0.015, 332),
  3: oklch(97.8, 0.03, 334),
  4: oklch(95, 0.06, 336),
  5: oklch(89.2, 0.1, 338),
  6: oklch(81.2, 0.16, 340),
  7: oklch(71.8, 0.22, 342),
  8: oklch(62.8, 0.25, 344),
  9: oklch(57.2, 0.22, 346),
  10: oklch(52, 0.18, 348),
  11: oklch(42.5, 0.14, 350),
  12: oklch(31.5, 0.1, 352),
};

export const fuchsia = {
  1: oklch(99.5, 0.008, 310),
  2: oklch(99.2, 0.015, 312),
  3: oklch(97.5, 0.03, 314),
  4: oklch(94.2, 0.06, 316),
  5: oklch(87.5, 0.11, 318),
  6: oklch(78.2, 0.18, 320),
  7: oklch(68.2, 0.24, 322),
  8: oklch(59.2, 0.26, 324),
  9: oklch(53.8, 0.24, 326),
  10: oklch(48.5, 0.2, 328),
  11: oklch(39.2, 0.15, 330),
  12: oklch(28.8, 0.1, 332),
};

export const primaryA = {
  1: c.alpha(primary[1], 0),
  2: c.alpha(primary[1], 0.3),
  3: c.alpha(primary[1], 0.5),
  4: c.alpha(primary[1], 0.7),
  5: c.alpha(primary[1], 0.8),
  6: c.alpha(primary[1], 0.9),
  7: primary[7],
  8: primary[8],
  9: primary[9],
  10: primary[10],
  11: primary[11],
  12: primary[12],
};

/** Syntax highlighting ramps — source of truth is `@examples/design-system` (`ds-code-syntax`). */
export const codeTheme = codeSyntaxBrandPalettes;

export const colorLightValues = {
  primary: primary[9],
  primaryHover: primary[10],
  primarySubtle: primary[2],
  surface: neutral[1],
  surfaceRaised: neutral[2],
  sidebarBg: neutral[2],
  sidebarBorder: neutral[6],
  text: neutral[12],
  textMuted: neutral[9],
  textFaint: neutral[7],
  border: neutral[6],
  link: primary[9],
  linkHover: primary[10],
  searchBg: neutral[3],
  searchBorder: neutral[6],
  searchText: neutral[10],
  codeBg: neutral[2],
  codeBorder: neutral[6],
};

export const color = tokens.create('docs-color', colorLightValues);

export const space = tokens.create('docs-space', {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
});

export const font = tokens.create('docs-font', {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Fira Code", ui-monospace, "Cascadia Code", monospace',
});

const dark = {
  bg: oklch(12.5, 0.003, 264),
  bgSubtle: oklch(14.5, 0.003, 264),
  bgRaised: oklch(17, 0.004, 264),
  bgElevated: oklch(20, 0.005, 264),
  border: oklch(23, 0.005, 264),
  borderStrong: oklch(28, 0.006, 264),
  text: oklch(95, 0.002, 264),
  textMuted: oklch(65, 0.006, 264),
  textFaint: oklch(45, 0.006, 264),
};

export const colorDarkValues = {
  primary: primary[7],
  primaryHover: primary[6],
  primarySubtle: oklch(18, 0.04, 170),
  surface: dark.bg,
  surfaceRaised: dark.bgRaised,
  sidebarBg: dark.bgSubtle,
  sidebarBorder: dark.border,
  text: dark.text,
  textMuted: dark.textMuted,
  textFaint: dark.textFaint,
  border: dark.border,
  link: primary[7],
  linkHover: primary[6],
  searchBg: dark.bgRaised,
  searchBorder: dark.border,
  searchText: dark.textMuted,
  codeBg: dark.bgSubtle,
  codeBorder: dark.border,
};

export const darkTheme = tokens.createTheme('docs-dark', {
  'docs-color': colorDarkValues,
  'ds-color': designColorDarkValues as Record<string, string>,
  'ds-code-syntax': codeSyntaxDarkValues as Record<string, string>,
});
