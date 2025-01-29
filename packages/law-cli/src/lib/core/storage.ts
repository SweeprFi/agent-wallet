import { LocalStorage as NodeLocalStorage } from 'node-localstorage';

export enum StorageKeys {
  LIT_NETWORK = 'litNetwork',
  RPCS = 'rpcs',
  ADMIN_PRIVATE_KEY = 'adminPrivateKey',
  ADMIN_SIGNER_TYPE = 'adminSignerType',
}

export class LocalStorage {
  private storage: NodeLocalStorage;

  constructor(storageFilePath: string) {
    this.storage = new NodeLocalStorage(storageFilePath);
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
}
