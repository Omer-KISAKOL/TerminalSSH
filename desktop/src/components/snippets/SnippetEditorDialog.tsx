import { useEffect, useState } from 'react'

import type { SaveSnippetRequest, Snippet } from '@shared/contracts/snippet'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type SnippetEditorDialogProps = {
  snippet?: Snippet | null
  open: boolean
  onClose: () => void
  onSave: (input: SaveSnippetRequest) => Promise<void>
}

export function SnippetEditorDialog({
  snippet,
  open,
  onClose,
  onSave,
}: SnippetEditorDialogProps) {
  const { t } = useLocale()
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setName(snippet?.name ?? '')
    setContent(snippet?.content ?? '')
    setError(null)
  }, [open, snippet])

  if (!open) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim()) {
      setError(t('snippets.nameRequired'))
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        id: snippet?.id,
        name: name.trim(),
        content,
      })
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('snippets.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        className="w-full max-w-lg rounded-xl border border-border bg-surface-raised p-5 shadow-2xl"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <h3 className="text-lg font-semibold text-text">
          {snippet ? t('snippets.editTitle') : t('snippets.createTitle')}
        </h3>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-text-muted">{t('snippets.nameLabel')}</span>
            <input
              className="field-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-text-muted">{t('snippets.contentLabel')}</span>
            <textarea
              className="field-input min-h-32 font-mono"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-status-error">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}