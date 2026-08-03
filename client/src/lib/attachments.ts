export const ALLOWED_ATTACHMENT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_ACTIVE_ATTACHMENTS = 5

export type AttachmentStatus = 'ready' | 'uploading' | 'success' | 'error' | 'invalid'

export type AttachmentChip = {
  clientId: string
  file: File
  name: string
  size: number
  status: AttachmentStatus
  progress: number
  errorMessage?: string
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? '' : filename.slice(dot).toLowerCase()
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Client-side mirror of BR-12/13/14 -- a UX convenience; the server remains the source of truth. */
export function validateAttachmentFile(file: File, currentAcceptedCount: number): string | null {
  if (currentAcceptedCount >= MAX_ACTIVE_ATTACHMENTS) {
    return 'Maximum 5 attachments reached.'
  }
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extensionOf(file.name))) {
    return 'Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF.'
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return 'File exceeds the 5 MB size limit.'
  }
  return null
}
