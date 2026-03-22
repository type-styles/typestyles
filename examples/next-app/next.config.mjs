import { withTypestylesExtract } from '@typestyles/next/build';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['typestyles', '@typestyles/next', '@examples/react-design-system'],
};

export default withTypestylesExtract(nextConfig);
