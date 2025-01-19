import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class AsyncLocalStorageService {
  private asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

  run(callback: () => void, data: Record<string, any>) {
    const store = new Map(Object.entries(data));
    this.asyncLocalStorage.run(store, callback);
  }

  get<T>(key: string): T | undefined {
    return this.asyncLocalStorage.getStore()?.get(key);
  }

  set<T>(key: string, value: T): void {
    this.asyncLocalStorage.getStore()?.set(key, value);
  }
}
