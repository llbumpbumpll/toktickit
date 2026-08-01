import { type ReactNode, useId } from 'react'

type FieldProps = {
  label: string
  required?: boolean
  readOnly?: boolean
  error?: string
  hint?: string
  children: (fieldProps: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean; readOnly?: boolean }) => ReactNode
}

/**
 * Shared field wrapper per ui-spec.md §3: label + required-asterisk +
 * control + validation message, with distinct editable/read-only/invalid
 * styling. The asterisk never substitutes for the validation message.
 */
export function Field({ label, required, readOnly, error, hint, children }: FieldProps) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`mb-3 zg-field ${readOnly ? 'zg-field--readonly' : ''} ${error ? 'zg-field--invalid' : ''}`}>
      <label htmlFor={id} className="form-label fw-semibold">
        {label}
        {required && (
          <span className="text-danger ms-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        readOnly,
      })}
      {hint && !error && (
        <div id={hintId} className="form-text">
          {hint}
        </div>
      )}
      {error && (
        <div id={errorId} className="text-danger small mt-1" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
