import { createWriteStream, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config/index.js';
import type { MultipartFile } from '@fastify/multipart';
import { pipeline } from 'stream/promises';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export type StorageFolder = 'books' | 'authors' | 'users' | 'publishers';

export async function saveUploadedFile(
  file: MultipartFile,
  folder: StorageFolder,
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.');
  }

  const ext = extname(file.filename) || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const dir = join(config.upload.storagePath, folder);

  mkdirSync(dir, { recursive: true });

  const filepath = join(dir, filename);
  await pipeline(file.file, createWriteStream(filepath));

  return `/${folder}/${filename}`;
}

export function getFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `/storage${path}`;
}
