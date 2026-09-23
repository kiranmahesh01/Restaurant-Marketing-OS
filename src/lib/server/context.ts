import { AsyncLocalStorage } from 'node:async_hooks';
import type { StoreShape } from '../types';
export type StoreContext = { data: StoreShape; dirty: boolean; rollback?: Array<()=>Promise<void>>; afterCommit?: Array<()=>Promise<void>> };
export const storeContext = new AsyncLocalStorage<StoreContext>();
export function isDemoMode() { return process.env.DEMO_MODE === 'true'; }
export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
