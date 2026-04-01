import { describe, it, expect, vi } from 'vitest';
import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import { withTypestylesExtract } from './build.js';

type WebpackContext = Parameters<NonNullable<NextConfig['webpack']>>[1];

describe('withTypestylesExtract', () => {
  it('merges NEXT_PUBLIC_TYPESTYLES_RUNTIME_DISABLED into env for Turbopack + webpack', () => {
    const merged = withTypestylesExtract({ env: { CUSTOM: 'x' } }, { disableClientRuntime: true });
    expect(merged.env).toEqual({
      CUSTOM: 'x',
      NEXT_PUBLIC_TYPESTYLES_RUNTIME_DISABLED: 'true',
    });
  });

  it('does not override env when disableClientRuntime is false', () => {
    const merged = withTypestylesExtract({ env: { CUSTOM: 'x' } }, { disableClientRuntime: false });
    expect(merged.env).toEqual({ CUSTOM: 'x' });
  });

  it('chains user webpack() and adds DefinePlugin on the client', async () => {
    const webpackMod = await import('webpack');
    const userWebpack = vi.fn((cfg: { plugins: unknown[] }) => {
      cfg.plugins.push('user-marker');
      return cfg;
    });
    const merged = withTypestylesExtract({ webpack: userWebpack });
    const config = { plugins: [] as unknown[] };
    const result = merged.webpack!(
      config as Configuration,
      {
        isServer: false,
      } as WebpackContext,
    );
    expect(userWebpack).toHaveBeenCalled();
    const hasDefine = result.plugins?.some(
      (p: unknown) => p instanceof webpackMod.default.DefinePlugin,
    );
    expect(hasDefine).toBe(true);
  });

  it('does not add DefinePlugin for server bundles', async () => {
    const webpackMod = await import('webpack');
    const merged = withTypestylesExtract({});
    const config = { plugins: [] as unknown[] };
    const result = merged.webpack!(
      config as Configuration,
      {
        isServer: true,
      } as WebpackContext,
    );
    const hasDefine = result.plugins?.some(
      (p: unknown) => p instanceof webpackMod.default.DefinePlugin,
    );
    expect(hasDefine).toBe(false);
  });
});
