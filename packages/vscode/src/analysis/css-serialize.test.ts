import { describe, expect, it } from 'vitest';
import {
  buildComponentClassName,
  buildSingleClassName,
  defaultClassNamingConfig,
} from './class-naming';
import { formatDeclaration, serializeStyle } from './css-serialize';

describe('css-serialize', () => {
  it('serializes declarations with kebab-case and px defaults', () => {
    expect(formatDeclaration('backgroundColor', '#0066ff')).toBe('background-color: #0066ff');
    expect(formatDeclaration('fontWeight', 500)).toBe('font-weight: 500');
    expect(formatDeclaration('padding', 8)).toBe('padding: 8px');
  });

  it('serializes nested selectors', () => {
    const rules = serializeStyle('.button-base', {
      color: 'white',
      '&:hover': { opacity: 0.8 },
    });
    expect(rules).toHaveLength(2);
    expect(rules[0]?.css).toContain('.button-base { color: white;');
    expect(rules[1]?.css).toContain('.button-base:hover { opacity: 0.8;');
  });
});

describe('class-naming', () => {
  it('builds semantic class names', () => {
    const cfg = { ...defaultClassNamingConfig, scopeId: 'app' };
    expect(buildSingleClassName(cfg, 'card', { padding: '8px' })).toBe('app-card');
    expect(buildComponentClassName(cfg, 'button', 'base', { display: 'flex' })).toBe(
      'app-button-base',
    );
    expect(buildComponentClassName(cfg, 'button', 'intent-primary', { color: 'blue' })).toBe(
      'app-button-intent-primary',
    );
  });
});
