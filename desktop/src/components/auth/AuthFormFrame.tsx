import type { ReactNode } from 'react'

type AuthFormFrameProps = {
  title: string
  subtitle: string
  error: string | null
  children: ReactNode
  footer?: ReactNode
}

const authHighlightClass =
  'transition-[border-color,box-shadow] hover:border-status-connected hover:ring-2 hover:ring-status-connected/45 focus:border-status-connected focus:outline-none focus:ring-2 focus:ring-status-connected/45'

export const authFieldClass = `field-input w-full border-white/20 bg-black/40 text-white placeholder:text-white/45 ${authHighlightClass}`
export const authButtonClass = `h-10 w-full border-white/25 bg-white/5 text-sm font-medium text-white hover:bg-white/10 hover:text-white ${authHighlightClass} hover:!ring-status-connected/45 focus:!ring-status-connected/45`
export const authLabelClass = 'font-medium text-white'

export function AuthFormFrame({ title, subtitle, error, children, footer }: AuthFormFrameProps) {
  return (
    <div className="auth-form-frame w-full max-w-104 rounded-xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-8">
      <div className="mb-6 space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="text-sm leading-relaxed text-white/75">{subtitle}</p>
      </div>

      {error ? (
        <p
          className="mb-5 rounded-lg border border-status-error/35 bg-status-error/10 px-3 py-2.5 text-sm leading-relaxed text-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">{children}</div>

      {footer ? <div className="mt-5 flex flex-col gap-2.5 border-t border-white/15 pt-5">{footer}</div> : null}
    </div>
  )
}