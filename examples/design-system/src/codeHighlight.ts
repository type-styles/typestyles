import { styles } from 'typestyles';
import { darkThemeClass, designTokens as t } from './tokens';

const light = {
  base: t.color.text,
  keyword: t.color.accent,
  title: t.color.accent,
  attr: t.color.textMuted,
  string: t.color.success,
  builtIn: t.color.accentHover,
  comment: t.color.textMuted,
  name: t.color.danger,
  section: t.color.accent,
  bullet: t.color.accentHover,
  addition: t.color.success,
  additionBg: t.color.surfaceMuted,
  deletion: t.color.danger,
  deletionBg: t.color.surfaceMuted,
} as const;

const dark = {
  base: t.color.text,
  keyword: t.color.accent,
  title: t.color.accent,
  attr: t.color.textMuted,
  string: t.color.success,
  builtIn: t.color.accentHover,
  comment: t.color.textMuted,
  name: t.color.danger,
  section: t.color.accent,
  bullet: t.color.accentHover,
  addition: t.color.success,
  additionBg: 'rgb(16 185 129 / 0.12)',
  deletion: t.color.danger,
  deletionBg: 'rgb(248 113 113 / 0.12)',
} as const;

styles.create('ds-hljs', {
  '.hljs': {
    color: light.base,
    background: 'transparent',
    display: 'block',
    overflowX: 'auto',
  },
  '.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_':
    {
      color: light.keyword,
    },
  '.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_': {
    color: light.title,
  },
  '.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-variable,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id':
    {
      color: light.attr,
    },
  '.hljs-regexp,.hljs-string,.hljs-meta .hljs-string': {
    color: light.string,
  },
  '.hljs-built_in,.hljs-symbol': {
    color: light.builtIn,
  },
  '.hljs-comment,.hljs-code,.hljs-formula': {
    color: light.comment,
  },
  '.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo': {
    color: light.name,
  },
  '.hljs-subst': {
    color: light.base,
  },
  '.hljs-section': {
    color: light.section,
    fontWeight: 'bold',
  },
  '.hljs-bullet': {
    color: light.bullet,
  },
  '.hljs-emphasis': {
    color: light.base,
    fontStyle: 'italic',
  },
  '.hljs-strong': {
    color: light.base,
    fontWeight: 'bold',
  },
  '.hljs-addition': {
    color: light.addition,
    backgroundColor: light.additionBg,
  },
  '.hljs-deletion': {
    color: light.deletion,
    backgroundColor: light.deletionBg,
  },
  [`.${darkThemeClass} .hljs`]: {
    color: dark.base,
    background: 'transparent',
    display: 'block',
    overflowX: 'auto',
  },
  [`.${darkThemeClass} .hljs-keyword,.${darkThemeClass} .hljs-meta .hljs-keyword,.${darkThemeClass} .hljs-template-tag,.${darkThemeClass} .hljs-template-variable,.${darkThemeClass} .hljs-type,.${darkThemeClass} .hljs-variable.language_`]:
    {
      color: dark.keyword,
    },
  [`.${darkThemeClass} .hljs-title,.${darkThemeClass} .hljs-title.class_,.${darkThemeClass} .hljs-title.class_.inherited__,.${darkThemeClass} .hljs-title.function_`]:
    {
      color: dark.title,
    },
  [`.${darkThemeClass} .hljs-attr,.${darkThemeClass} .hljs-attribute,.${darkThemeClass} .hljs-literal,.${darkThemeClass} .hljs-meta,.${darkThemeClass} .hljs-number,.${darkThemeClass} .hljs-operator,.${darkThemeClass} .hljs-variable,.${darkThemeClass} .hljs-selector-attr,.${darkThemeClass} .hljs-selector-class,.${darkThemeClass} .hljs-selector-id`]:
    {
      color: dark.attr,
    },
  [`.${darkThemeClass} .hljs-regexp,.${darkThemeClass} .hljs-string,.${darkThemeClass} .hljs-meta .hljs-string`]:
    {
      color: dark.string,
    },
  [`.${darkThemeClass} .hljs-built_in,.${darkThemeClass} .hljs-symbol`]: {
    color: dark.builtIn,
  },
  [`.${darkThemeClass} .hljs-comment,.${darkThemeClass} .hljs-code,.${darkThemeClass} .hljs-formula`]:
    {
      color: dark.comment,
    },
  [`.${darkThemeClass} .hljs-name,.${darkThemeClass} .hljs-quote,.${darkThemeClass} .hljs-selector-tag,.${darkThemeClass} .hljs-selector-pseudo`]:
    {
      color: dark.name,
    },
  [`.${darkThemeClass} .hljs-subst`]: {
    color: dark.base,
  },
  [`.${darkThemeClass} .hljs-section`]: {
    color: dark.section,
    fontWeight: 'bold',
  },
  [`.${darkThemeClass} .hljs-bullet`]: {
    color: dark.bullet,
  },
  [`.${darkThemeClass} .hljs-emphasis`]: {
    color: dark.base,
    fontStyle: 'italic',
  },
  [`.${darkThemeClass} .hljs-strong`]: {
    color: dark.base,
    fontWeight: 'bold',
  },
  [`.${darkThemeClass} .hljs-addition`]: {
    color: dark.addition,
    backgroundColor: dark.additionBg,
  },
  [`.${darkThemeClass} .hljs-deletion`]: {
    color: dark.deletion,
    backgroundColor: dark.deletionBg,
  },
});

