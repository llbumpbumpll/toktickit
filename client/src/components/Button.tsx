import { type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  busy?: boolean
  busyLabel?: string
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-outline-secondary',
  tertiary: 'btn-link text-decoration-none',
  destructive: 'btn-outline-danger',
}

/**
 * Button hierarchy per ui-spec.md §3: primary/secondary/tertiary/destructive,
 * all with visible text (icons may accompany but never replace it), and a
 * shared busy state (BR-18) that disables the control during a request.
 */
export function Button({ variant = 'primary', busy, busyLabel = 'Working…', disabled, children, className = '', ...rest }: ButtonProps) {
  return (
    <button className={`btn ${VARIANT_CLASS[variant]} ${className}`} disabled={disabled || busy} {...rest}>
      {busy ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
