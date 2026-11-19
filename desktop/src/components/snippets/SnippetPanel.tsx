import { useCallback, useMemo, useState } from 'react'

import type { SaveSnippetRequest, Snippet } from '@shared/contracts/snippet'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'
import { useSnippets } from '@/hooks/useSnippets'
import { loadSnippetPanelCollapsed, saveSnippetPanelCollapsed } from '@/lib/sidebar-storage'

import { SnippetEditorDialog } from './SnippetEditorDialog'

type SnippetPanelProps = {
  mode: 'settings' | 'terminal'
  embedded?: boolean
  onApply?: (content: string, appendNewline: boolean) => void
}

function buildReorderedIds(ids: string[], draggedId: string, targetId: string): string[] | null {
  const from = ids.indexOf(draggedId)
  const to = ids.indexOf(targetId)
  if (from < 0 || to < 0 || from === to) {
    return null
  }

  const next = [...ids]
  next.splice(from, 1)
  next.splice(to, 0, draggedId)
  return next
}

export function SnippetPanel({ mode, embedded = false, onApply }: SnippetPanelProps) {
  const { t } = useLocale()
  const { snippets, isLoading, error, save, remove, reorder } = useSnippets()
  const [query, setQuery] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [collapsed, setCollapsed] = useState(
    () => mode === 'terminal' && !embedded && loadSnippetPanelCollapsed(),
  )

  const setCollapsedPersisted = useCallback((next: boolean) => {
    setCollapsed(next)
    if (mode === 'terminal' && !embedded) {
      saveSnippetPanelCollapsed(next)
    }
  }, [embedded, mode])

  const filteredSnippets = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snippets
    return snippets.filter(
      (snippet) =>
        snippet.name.toLowerCase().includes(q) || snippet.content.toLowerCase().includes(q),
    )
  }, [query, snippets])

  const canReorder = query.trim().length === 0 && snippets.length > 1

  const handleDropOnSnippet = useCallback(
    (targetId: string, draggedId: string | null) => {
      if (!canReorder || !draggedId) {
        return
      }

      const nextOrder = buildReorderedIds(
        snippets.map((snippet) => snippet.id),
        draggedId,
        targetId,
      )
      if (!nextOrder) {
        return
      }

      void reorder(nextOrder)
    },
    [canReorder, reorder, snippets],
  )

  const resetDragState = useCallback(() => {
    setDraggingId(null)
    setDropTargetId(null)
  }, [])

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
    const confirmed = window.confirm(t('snippets.deleteConfirm', { name: snippet.name }))
    if (!confirmed) return
    await remove(snippet.id)
  }

  const isTerminalDocked = mode === 'terminal' && !embedded

  if (isTerminalDocked && collapsed) {
    return (
      <aside className="flex w-11 shrink-0 flex-col items-center border-l border-border bg-surface-raised py-2">
        <button
          type="button"
          className="rounded-lg border border-border px-1.5 py-2 text-xs font-medium text-text-muted transition hover:bg-surface-muted hover:text-text"
          aria-label={t('snippets.expand')}
          title={t('snippets.panelTitle')}
          onClick={() => setCollapsedPersisted(false)}
        >
          {'{ }'}
        </button>
        <button
          type="button"
          className="mt-2 rounded-lg border border-border px-2 py-1 text-sm text-text-muted hover:bg-surface-muted hover:text-text"
          aria-label={t('snippets.expand')}
          onClick={() => setCollapsedPersisted(false)}
        >
          «
        </button>
      </aside>
    )
  }

  const rootClass = embedded
    ? 'flex max-h-96 flex-col bg-surface-raised'
    : mode === 'terminal'
      ? 'flex min-h-0 w-80 shrink-0 flex-col border-l border-border bg-surface-raised lg:w-96'
      : 'flex w-96 shrink-0 flex-col border-l border-border bg-surface-raised'

  return (
    <aside className={rootClass}>
      <div
        className={
          isTerminalDocked ? 'shrink-0 border-b border-border px-3 py-2.5' : 'border-b border-border p-3'
        }
      >
        <div className="flex items-center gap-2">
          {isTerminalDocked ? (
            <button
              type="button"
              className="shrink-0 rounded-lg border border-border px-2 py-1.5 text-sm text-text-muted hover:bg-surface-muted hover:text-text"
              aria-label={t('snippets.collapse')}
              onClick={() => setCollapsedPersisted(true)}
            >
              »
            </button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="h-8 min-w-0 flex-1 justify-start text-xs font-medium"
            onClick={openCreate}
          >
            {'{ }'} {t('snippets.new')}
          </Button>
        </div>
        <input
          className="field-input mt-2 text-sm"
          placeholder={t('snippets.searchPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query.trim().length > 0 && snippets.length > 1 ? (
          <p className="mt-1.5 text-[11px] text-text-muted">{t('snippets.reorderWhileSearch')}</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? <p className="text-sm text-text-muted">{t('common.loading')}</p> : null}
        {error ? <p className="text-sm text-status-error">{error}</p> : null}

        {!isLoading && filteredSnippets.length === 0 ? (
          <p className="text-sm text-text-muted">{t('snippets.empty')}</p>
        ) : null}

        <div className="space-y-3">
          {filteredSnippets.map((snippet) => (
            <article
              key={snippet.id}
              className={`rounded-lg border bg-surface p-3 transition ${
                dropTargetId === snippet.id && draggingId !== snippet.id
                  ? 'border-status-connected ring-1 ring-status-connected/40'
                  : 'border-border'
              } ${draggingId === snippet.id ? 'opacity-55' : ''}`}
              onDragOver={(event) => {
                if (!canReorder || !draggingId || draggingId === snippet.id) {
                  return
                }
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDropTargetId(snippet.id)
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) {
                  return
                }
                if (dropTargetId === snippet.id) {
                  setDropTargetId(null)
                }
              }}
              onDrop={(event) => {
                event.preventDefault()
                const draggedId = event.dataTransfer.getData('text/plain') || draggingId
                handleDropOnSnippet(snippet.id, draggedId)
                resetDragState()
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  {canReorder ? (
                    <div
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', snippet.id)
                        event.dataTransfer.effectAllowed = 'move'
                        setDraggingId(snippet.id)
                      }}
                      onDragEnd={resetDragState}
                      className="mt-0.5 shrink-0 cursor-grab rounded p-1 text-text-muted active:cursor-grabbing hover:bg-surface-muted hover:text-text"
                      aria-label={t('snippets.dragHandle')}
                      title={t('snippets.dragHandle')}
                    >
                      <GripIcon />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{'{ }'}</span>
                      <h4 className="truncate text-sm font-medium text-text">{snippet.name}</h4>
                    </div>
                  </div>
                </div>
                {mode === 'terminal' ? (
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      aria-label={t('snippets.edit')}
                      title={t('snippets.edit')}
                      className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text"
                      onClick={() => openEdit(snippet)}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      aria-label={t('snippets.delete')}
                      title={t('snippets.delete')}
                      className="rounded p-1 text-text-muted hover:bg-status-error/10 hover:text-status-error"
                      onClick={() => void handleDelete(snippet)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ) : null}
              </div>

              <pre className="mt-2 overflow-hidden text-ellipsis whitespace-pre-wrap font-mono text-xs text-text-muted">
                {snippet.content}
              </pre>

              {mode === 'terminal' ? (
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1 px-2 py-1.5 text-xs"
                    onClick={() => onApply?.(snippet.content, true)}
                  >
                    RUN
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 px-2 py-1.5 text-xs"
                    onClick={() => onApply?.(snippet.content, false)}
                  >
                    PASTE
                  </Button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEdit(snippet)}>
                    {t('snippets.edit')}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="px-2 py-1 text-xs"
                    onClick={() => void handleDelete(snippet)}
                  >
                    {t('snippets.delete')}
                  </Button>
                </div>
              )}
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

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <circle cx="9" cy="7" r="1.35" />
      <circle cx="15" cy="7" r="1.35" />
      <circle cx="9" cy="12" r="1.35" />
      <circle cx="15" cy="12" r="1.35" />
      <circle cx="9" cy="17" r="1.35" />
      <circle cx="15" cy="17" r="1.35" />
    </svg>
  )
}
