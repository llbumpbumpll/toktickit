import { API_BASE_URL } from './api'

export type UploadResult = { ok: true } | { ok: false; message: string }

/**
 * specification.md §11: XMLHttpRequest, not fetch, so upload.onprogress can
 * drive a real percentage progress bar (AC-39) -- a deliberate, scoped
 * exception to the fetch-based pattern used elsewhere in the client.
 */
export function uploadAttachment(
  ticketId: number,
  requesterId: number,
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/tickets/${ticketId}/attachments`)
    xhr.setRequestHeader('X-Dev-Requester-Id', String(requesterId))

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ok: true })
        return
      }
      let message = 'Upload failed.'
      try {
        const body = JSON.parse(xhr.responseText)
        if (body?.error?.message) message = body.error.message
      } catch {
        // ignore unparsable error body, fall back to the generic message
      }
      resolve({ ok: false, message })
    }

    xhr.onerror = () => resolve({ ok: false, message: 'Upload failed due to a network error.' })

    const formData = new FormData()
    formData.append('file', file)
    xhr.send(formData)
  })
}
