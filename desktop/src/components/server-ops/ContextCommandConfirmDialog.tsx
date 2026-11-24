import type { ContextCommandSuggestion } from '@shared/contracts/server-ops'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type ContextCommandConfirmDialogProps = {
  open: boolean
  suggestion: ContextCommandSuggestion | null
  loading?: boolean
  onCancel: () => void
  onConfirmPaste: () => void
}

export function ContextCommandConfirmDialog({
  open,
  suggestion,
  loading = false,
  onCancel,
  onConfirmPaste,
}: ContextCommandConfirmDialogProps) {
  const { t } = useLocale()

  if (!open || !suggestion) {
    return null
  }

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-5 shadow-xl"
        role="dialog"
        aria-labelledby="context-command-title"
        aria-describedby="context-command-desc"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id="context-command-title" className="text-base font-semibold text-text">
          {t('serverOps.suggestionConfirmTitle')}
        </h3>
        <p id="context-command-desc" className="mt-1 text-sm text-text-muted">
          {t('serverOps.suggestionConfirmSubtitle')}
        </p>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-text">{suggestion.label}</p>
          <p className="text-xs text-text-muted">{suggestion.description}</p>
          <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-black/35 p-3 font-mono text-xs text-text">
            {suggestion.command}
          </pre>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="primary" onClick={onConfirmPaste} loading={loading}>
            {t('serverOps.suggestionConfirmPaste')}
          </Button>
        </div>
      </div>
    </div>
  )
}