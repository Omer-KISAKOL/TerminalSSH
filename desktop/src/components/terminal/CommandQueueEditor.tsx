import { useEffect, useId, useState } from 'react'

import type { CommandQueueSnapshot } from '@/lib/command-queue'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type CommandQueueEditorProps = {
  snapshot: CommandQueueSnapshot
  getEditorText: () => string
  onApplyEditorText: (text: string) => boolean
  onBegin: () => void
  onCancel: () => void
}

export function CommandQueueEditor({
  snapshot,
  getEditorText,
  onApplyEditorText,
  onBegin,
  onCancel,
}: CommandQueueEditorProps) {
  const { t } = useLocale()
  const labelId = useId()
  const [text, setText] = useState('')

  useEffect(() => {
    if (snapshot.phase === 'preview') {
      setText(getEditorText())
    }
  }, [getEditorText, snapshot.phase, snapshot.lines])

  if (snapshot.phase !== 'preview' || snapshot.lines.length === 0) {
    return null
  }

  const handleRun = () => {
    if (!onApplyEditorText(text)) {
      return
    }
    onBegin()
  }

  return (
    <div
      className="absolute inset-x-4 bottom-3 z-20 sm:inset-x-5 md:inset-x-6"
      role="region"
      aria-labelledby={labelId}
    >
      <div className="overflow-hidden rounded-lg border border-border bg-surface-raised/98 shadow-lg shadow-black/25 backdrop-blur-sm">
        <form
          className="flex flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            handleRun()
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p id={labelId} className="text-xs font-medium text-text">
              {t('commandQueue.editTitle')}
            </p>
            <p className="text-[11px] text-text-muted">{t('commandQueue.editHint')}</p>
          </div>
          <textarea
            className="field-input max-h-44 min-h-28 resize-y rounded-none border-0 border-b border-border bg-surface font-mono text-xs leading-relaxed shadow-none focus:ring-0"
            value={text}
            spellCheck={false}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="flex justify-end gap-2 px-3 py-2">
            <Button type="button" variant="ghost" className="h-8 px-3 text-xs" onClick={onCancel}>
              {t('commandQueue.cancel')}
            </Button>
            <Button type="submit" variant="primary" className="h-8 px-3 text-xs">
              {t('commandQueue.run')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}