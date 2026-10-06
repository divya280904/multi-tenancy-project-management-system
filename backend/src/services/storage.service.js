const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class StorageService {
  async upload(fileBuffer, storageKey) {
    throw new Error('StorageService.upload must be implemented by a provider');
  }

  async downloadStream(storageKey) {
    throw new Error('StorageService.downloadStream must be implemented by a provider');
  }

  async delete(storageKey) {
    throw new Error('StorageService.delete must be implemented by a provider');
  }
}

class LocalStorageService extends StorageService {
  constructor(baseDir = path.resolve(__dirname, '../../storage/uploads')) {
    super();
    this.baseDir = baseDir;
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  resolvePath(storageKey) {
    if (!storageKey || typeof storageKey !== 'string') {
      throw new Error('Invalid storage key');
    }

    const sanitizedKey = storageKey.replace(/\\/g, '/');
    const normalized = path.normalize(sanitizedKey);
    const fullPath = path.resolve(this.baseDir, normalized);

    if (!fullPath.startsWith(path.resolve(this.baseDir))) {
      throw new Error('Storage key resolves outside the configured upload directory');
    }

    return fullPath;
  }

  async upload(fileBuffer, storageKey) {
    const resolvedPath = this.resolvePath(storageKey);
    const dir = path.dirname(resolvedPath);
    fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(resolvedPath, fileBuffer);
    return { key: storageKey, path: resolvedPath };
  }

  async downloadStream(storageKey) {
    const resolvedPath = this.resolvePath(storageKey);
    await fs.promises.access(resolvedPath);
    return fs.createReadStream(resolvedPath);
  }

  async delete(storageKey) {
    const resolvedPath = this.resolvePath(storageKey);
    try {
      await fs.promises.access(resolvedPath);
      await fs.promises.unlink(resolvedPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

const storageService = new LocalStorageService();

module.exports = {
  StorageService,
  LocalStorageService,
  storageService,
  buildStorageKey: (projectId, originalName) => {
    const safeName = path.basename(originalName || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    const extension = path.extname(safeName);
    const stem = path.basename(safeName, extension).slice(0, 60) || 'file';
    return `projects/${projectId}/${Date.now()}-${crypto.randomUUID()}-${stem}${extension}`;
  }
};
