import { useMemo, useState } from 'react'

import type { SaveSnippetRequest, Snippet } from '@shared/contracts/snippet'

import { Button } from '@/components/ui/Button'
import { useSnippets } from '@/hooks/useSnippets'

import { SnippetEditorDialog } from './SnippetEditorDialog'

type SnippetPanelProps = {
  mode: 'settings' | 'terminal'
  embedded?: boolean
  onApply?: (content: string, appendNewline: boolean) => void
}

export function SnippetPanel({ mode, embedded = false, onApply }: SnippetPanelProps) {
  const { snippets, isLoading, error, save, remove } = useSnippets()
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)

  const filteredSnippets = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snippets
    return snippets.filter(
      (snippet) =>
        snippet.name.toLowerCase().includes(q) || snippet.content.toLowerCase().includes(q),
    )
  }, [query, snippets])

  const openCreate = () => {
    setEditingSnippet(null)
    setEditorOpen(true)
  }

  const openEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setEditorOpen(true)
  }

  const handleSave = async (input: SaveSnippetRequest) => {
    await save(input)
  }

  const handleDelete = async (snippet: Snippet) => {
    const confirmed = window.confirm(`"${snippet.name}" snippet'ini silmek istiyor musunuz?`)
    if (!confirmed) return
    await remove(snippet.id)
  }

  const rootClass = embedded
    ? 'flex max-h-96 flex-col bg-surface-raised'
    : 'flex w-80 shrink-0 flex-col border-l border-border bg-surface-raised'

  return (
    <aside className={rootClass}>
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" className="flex-1 justify-start" onClick={openCreate}>
            {'{ }'} Yeni Snippet
          </Button>
        </div>
        <input
          className="field-input mt-2"
          placeholder="Snippet ara…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? <p className="text-sm text-text-muted">Yükleniyor…</p> : null}
        {error ? <p className="text-sm text-status-error">{error}</p> : null}

        {!isLoading && filteredSnippets.length === 0 ? (
          <p className="text-sm text-text-muted">Henüz snippet yok.</p>
        ) : null}

        <div className="space-y-3">
          {filteredSnippets.map((snippet) => (
            <article
              key={snippet.id}
              className="rounded-lg border border-border bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{'{ }'}</span>
                    <h4 className="truncate text-sm font-medium text-text">{snippet.name}</h4>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {mode === 'terminal' ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2 py-1 text-[11px]"
                        onClick={() => onApply?.(snippet.content, true)}
                      >
                        RUN
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2 py-1 text-[11px]"
                        onClick={() => onApply?.(snippet.content, false)}
                      >
                        PASTE
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              <pre className="mt-2 overflow-hidden text-ellipsis whitespace-pre-wrap font-mono text-xs text-text-muted">
                {snippet.content}
              </pre>

              <div className="mt-3 flex gap-2">
                <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEdit(snippet)}>
                  Düzenle
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="px-2 py-1 text-xs"
                  onClick={() => void handleDelete(snippet)}
                >
                  Sil
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <SnippetEditorDialog
        snippet={editingSnippet}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />
    </aside>
  )
}
