import { useState } from 'react'

import type { ContextCommandSuggestion } from '@shared/contracts/server-ops'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

import { ContextCommandConfirmDialog } from './ContextCommandConfirmDialog'

type ContextSuggestionsViewProps = {
  suggestions: ContextCommandSuggestion[]
  onApprovePaste: (suggestion: ContextCommandSuggestion) => Promise<void>
}

export function ContextSuggestionsView({ suggestions, onApprovePaste }: ContextSuggestionsViewProps) {
  const { t } = useLocale()
  const [pending, setPending] = useState<ContextCommandSuggestion | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!pending) {
      return
    }

    setSubmitting(true)

    try {
      await onApprovePaste(pending)
      setPending(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0">
        <h3 className="text-sm font-semibold text-text">{t('serverOps.contextTitle')}</h3>
        <p className="text-xs text-text-muted">{t('serverOps.contextSubtitle')}</p>
      </div>

      {suggestions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
          {t('serverOps.contextEmpty')}
        </p>
      ) : (
        <ul className="scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="rounded-lg border border-border/80 bg-surface/50 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">{suggestion.label}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{suggestion.description}</p>
                </div>
                <Button
                  variant="secondary"
                  className="h-8 shrink-0 px-2 text-xs"
                  onClick={() => setPending(suggestion)}
                >
                  {t('serverOps.suggestionReview')}
                </Button>
              </div>
              <pre className="mt-2 max-h-16 overflow-hidden rounded border border-border/60 bg-black/20 p-2 font-mono text-[11px] text-text-muted">
                {suggestion.command}
              </pre>
            </li>
          ))}
        </ul>
      )}

      <ContextCommandConfirmDialog
        open={pending != null}
        suggestion={pending}
        loading={submitting}
        onCancel={() => {
          if (!submitting) {
            setPending(null)
          }
        }}
        onConfirmPaste={() => void handleConfirm()}
      />
    </div>
  )
}