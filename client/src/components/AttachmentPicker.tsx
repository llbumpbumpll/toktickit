import { useRef } from 'react'
import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  formatFileSize,
  MAX_ACTIVE_ATTACHMENTS,
  type AttachmentChip,
} from '../lib/attachments'

type AttachmentPickerProps = {
  attachments: AttachmentChip[]
  onAdd: (files: FileList) => void
  onRemove: (clientId: string) => void
  disabled?: boolean
}

/**
 * Shared file-picker per ui-spec.md §6/§8: selected-file chips with a real
 * upload progress bar (AC-39) and a proactive 5-attachment limit (AC-41).
 * Reused by Create Ticket now and Ticket Detail's "Add Attachment" later.
 */
export function AttachmentPicker({ attachments, onAdd, onRemove, disabled }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const acceptedCount = attachments.filter((a) => a.status !== 'invalid').length
  const limitReached = acceptedCount >= MAX_ACTIVE_ATTACHMENTS

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAdd(e.target.files)
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mb-3">
      <label htmlFor="attachment-input" className="form-label fw-semibold">
        Attachments
      </label>
      <input
        ref={inputRef}
        id="attachment-input"
        type="file"
        className="form-control"
        accept={ALLOWED_ATTACHMENT_EXTENSIONS.join(',')}
        multiple
        onChange={handleChange}
        disabled={disabled || limitReached}
      />
      {limitReached && <div className="form-text">Maximum 5 attachments reached.</div>}

      {attachments.length > 0 && (
        <ul className="list-group mt-2">
          {attachments.map((chip) => (
            <li
              key={chip.clientId}
              className="list-group-item d-flex align-items-center justify-content-between gap-2"
            >
              <div className="flex-grow-1 text-truncate" title={chip.name}>
                <span className="text-truncate d-inline-block" style={{ maxWidth: '220px', verticalAlign: 'bottom' }}>
                  {chip.name}
                </span>{' '}
                <span className="text-body-secondary small">({formatFileSize(chip.size)})</span>
                {chip.status === 'invalid' && (
                  <div className="small mt-1" style={{ color: 'var(--zg-error)' }} role="alert">
                    {chip.errorMessage}
                  </div>
                )}
                {chip.status === 'error' && (
                  <div className="small mt-1" style={{ color: 'var(--zg-error)' }} role="alert">
                    {chip.errorMessage ?? 'Upload failed.'}
                  </div>
                )}
                {chip.status === 'uploading' && (
                  <div className="progress mt-1" role="progressbar" aria-label={`Uploading ${chip.name}`} aria-valuenow={chip.progress} aria-valuemin={0} aria-valuemax={100} style={{ height: '6px' }}>
                    <div className="progress-bar" style={{ width: `${chip.progress}%`, backgroundColor: 'var(--zg-secondary)' }} />
                  </div>
                )}
                {chip.status === 'uploading' && <div className="small text-body-secondary">{chip.progress}%</div>}
                {chip.status === 'success' && (
                  <div className="small" style={{ color: 'var(--zg-success)' }}>
                    Uploaded
                  </div>
                )}
              </div>
              {(chip.status === 'ready' || chip.status === 'invalid') && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  aria-label={`Remove ${chip.name}`}
                  title="Remove"
                  onClick={() => onRemove(chip.clientId)}
                  disabled={disabled}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
