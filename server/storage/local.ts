import 'server-only';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { DocumentStorage } from './storage';

/**
 * Filesystem-backed storage under a base directory the host owns (a Docker
 * volume in production). Keys are validated so a crafted key can never escape
 * the base directory.
 */
export class LocalStorage implements DocumentStorage {
  private readonly base: string;

  constructor(baseDir: string) {
    this.base = resolve(baseDir);
  }

  private pathFor(key: string): string {
    // Keys are app-generated (a uuid + extension), but validate anyway: reject
    // absolute paths and any traversal, then confirm the result stays inside base.
    if (!key || key.startsWith('/') || key.includes('..')) {
      throw new Error('Invalid storage key');
    }
    const full = resolve(this.base, key);
    if (full !== this.base && !full.startsWith(this.base + '/')) {
      throw new Error('Invalid storage key');
    }
    return full;
  }

  async save(key: string, bytes: Buffer): Promise<void> {
    const full = this.pathFor(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, bytes);
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.pathFor(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.pathFor(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}
