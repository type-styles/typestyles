import { withTypestylesExtract } from '@typestyles/next/build';

const base = {
  transpilePackages: ['typestyles', '@typestyles/next'],
};

/**
 * Production: disable client `<style>` injection so the pre-built stylesheet is the only source
 * (cacheable, parallel-parsed CSS). Development: keep the runtime enabled so edits hot-reload
 * without re-running the extraction script on every change.
 */
export default process.env.NODE_ENV === 'production'
  ? withTypestylesExtract(base)
  : base;
