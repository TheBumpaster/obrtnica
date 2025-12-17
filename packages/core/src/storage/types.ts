export interface StoragePutResult {
  location: string;
  checksum: string;
}

export interface StorageAdapter {
  /**
   * Stores a file in the storage backend.
   * 
   * @param key - The key/path under which to store the object
   * @param bytes - The content to store as a Buffer
   * @param contentType - MIME type of the content (e.g., 'application/json')
   * @returns Promise containing the storage location and checksum (SHA-256)
   */
  putObject(key: string, bytes: Buffer, contentType: string): Promise<StoragePutResult>;

  /**
   * Generates a signed URL for downloading a stored object.
   * 
   * @param location - The storage location returned by putObject
   * @param expiresInSeconds - How long the URL should remain valid
   * @returns Promise containing the signed URL
   */
  getSignedUrl(location: string, expiresInSeconds: number): Promise<string>;
}
