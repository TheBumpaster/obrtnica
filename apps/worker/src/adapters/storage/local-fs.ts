import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import type { StorageAdapter, StoragePutResult } from '@serp/core';

export interface LocalFsStorageAdapterConfig {
  basePath: string;
}

export class LocalFsStorageAdapter implements StorageAdapter {
  private basePath: string;

  constructor(config: LocalFsStorageAdapterConfig) {
    this.basePath = config.basePath;
  }

  async putObject(key: string, bytes: Buffer, _contentType: string): Promise<StoragePutResult> {
    // Ensure base directory exists
    const fullPath = path.join(this.basePath, key);
    const dir = path.dirname(fullPath);
    
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, bytes);

    // Generate checksum (SHA-256)
    const hash = crypto.createHash('sha256');
    hash.update(bytes);
    const checksum = hash.digest('hex');

    // Return location as relative path from basePath
    return {
      location: key,
      checksum,
    };
  }

  async getSignedUrl(location: string, _expiresInSeconds: number): Promise<string> {
    // For local FS, we return a file:// URL (not actually signed)
    // In production with real auth, this would be a proper signed URL
    const fullPath = path.join(this.basePath, location);
    return `file://${fullPath}`;
  }

  /**
   * Helper method to read a file (not part of StorageAdapter interface)
   * Used internally by consumers to retrieve export data
   */
  async getObject(location: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, location);
    return await fs.readFile(fullPath);
  }
}
