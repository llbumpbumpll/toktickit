import fs from 'fs';
import path from 'path';

export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

export function ensureUploadDir(): void {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/** BR-12: allow-list validated by extension AND client-declared Content-Type, never content-sniffed. */
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.pdf': ['application/pdf'],
};

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_ACTIVE_ATTACHMENTS_PER_TICKET = 5;

export function isAllowedAttachment(originalFilename: string, mimeType: string): boolean {
  const ext = path.extname(originalFilename).toLowerCase();
  const allowedMimeTypes = ALLOWED_ATTACHMENT_TYPES[ext];
  return Boolean(allowedMimeTypes && allowedMimeTypes.includes(mimeType));
}
