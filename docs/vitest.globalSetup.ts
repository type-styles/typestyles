import { writeMcpContentBundle } from './src/lib/writeMcpContentBundle';

export default async function globalSetup() {
  await writeMcpContentBundle();
}
