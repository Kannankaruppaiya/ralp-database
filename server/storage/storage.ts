import 'server-only';
import { LocalStorage } from './local';

/**
 * Object storage for uploaded documents. The bytes live outside the database so
 * a clinical registry's file store can scale and be backed up independently.
 * One small interface, selected by STORAGE_DRIVER, so local disk today and an
 * S3/MinIO endpoint later are a config change, not a code change.
 */
export interface DocumentStorage {
  /** Persists bytes under an opaque key the caller generates. */
  save(key: string, bytes: Buffer): Promise<void>;
  /** Returns the bytes, or null if the key is unknown. */
  read(key: string): Promise<Buffer | null>;
  /** Removes an object; a no-op if it is already gone. */
  delete(key: string): Promise<void>;
}

let instance: DocumentStorage | null = null;

export function getStorage(): DocumentStorage {
  if (instance) return instance;
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  switch (driver) {
    case 'local':
      instance = new LocalStorage(process.env.STORAGE_LOCAL_DIR ?? './storage');
      return instance;
    // case 's3': instance = new S3Storage(...); return instance;  // future
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
  }
}
