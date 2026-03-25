import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

const s = t.codeSyntax;

/**
 * Maps semantic `ds-code-syntax` tokens to highlight.js class names (see README).
 * Light values live on `:root`; dark is applied via `darkThemeClass` overrides.
 */
styles.create('ds-hljs', {
  '.hljs': {
    color: s.base,
    background: 'transparent',
    display: 'block',
    overflowX: 'auto',
  },
  '.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_':
    {
      color: s.keyword,
    },
  '.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_': {
    color: s.title,
  },
  '.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-variable,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id':
    {
      color: s.attr,
    },
  '.hljs-regexp,.hljs-string,.hljs-meta .hljs-string': {
    color: s.string,
  },
  '.hljs-built_in,.hljs-symbol': {
    color: s.builtIn,
  },
  '.hljs-comment,.hljs-code,.hljs-formula': {
    color: s.comment,
  },
  '.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo': {
    color: s.name,
  },
  '.hljs-subst': {
    color: s.base,
  },
  '.hljs-section': {
    color: s.section,
    fontWeight: 'bold',
  },
  '.hljs-bullet': {
    color: s.bullet,
  },
  '.hljs-emphasis': {
    color: s.base,
    fontStyle: 'italic',
  },
  '.hljs-strong': {
    color: s.base,
    fontWeight: 'bold',
  },
  '.hljs-addition': {
    color: s.addition,
    backgroundColor: s.additionBg,
  },
  '.hljs-deletion': {
    color: s.deletion,
    backgroundColor: s.deletionBg,
  },
});
