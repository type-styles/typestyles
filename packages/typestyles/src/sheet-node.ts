import { AsyncLocalStorage } from 'node:async_hooks';
import {
  configureSheetIsolation,
  createSheetState,
  getGlobalSheetState,
  type SheetState,
} from './sheet-context';

const sheetStorage = new AsyncLocalStorage<SheetState>();

configureSheetIsolation({
  getStore: () => sheetStorage.getStore() ?? getGlobalSheetState(),
  runIsolated: <T>(fn: () => T) => sheetStorage.run(createSheetState(), fn),
});
