import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  loading?: boolean
  children: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border border-accent-hover bg-accent text-accent-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_6px_rgba(0,0,0,0.35)] hover:bg-accent-hover active:bg-accent-active focus:ring-accent/70',
  secondary:
    'border border-text-muted/45 bg-surface-muted text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-text-muted/70 hover:bg-surface-raised focus:ring-accent/40',
  success:
    'border border-status-connected/80 bg-status-connected text-[var(--color-on-connected)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-on-connected)_12%,transparent)] hover:brightness-110 active:brightness-95 focus:ring-status-connected/70',
  danger:
    'border border-status-error/85 bg-status-error text-[var(--color-on-danger)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:brightness-110 active:brightness-95 focus:ring-status-error/70',
  ghost:
    'border border-text-muted/35 bg-surface-muted/60 text-text-muted hover:border-text-muted/60 hover:bg-surface-muted hover:text-text focus:ring-accent/40',
}

export function Button({
  variant = 'secondary',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  )
}
