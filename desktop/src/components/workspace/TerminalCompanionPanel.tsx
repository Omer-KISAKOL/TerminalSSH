import { useState } from 'react'

import { SnippetPanel } from '@/components/snippets/SnippetPanel'
import { ServerOpsPanel } from '@/components/server-ops/ServerOpsPanel'
import { useLocale } from '@/hooks/useLocale'
import { loadSnippetPanelCollapsed, saveSnippetPanelCollapsed } from '@/lib/sidebar-storage'

type CompanionTab = 'snippets' | 'serverOps'

type TerminalCompanionPanelProps = {
  sessionId: string | null
  connected: boolean
  onApplySnippet: (content: string, appendNewline: boolean) => void
  onPasteCommand: (command: string) => void
}

export function TerminalCompanionPanel({
  sessionId,
  connected,
  onApplySnippet,
  onPasteCommand,
}: TerminalCompanionPanelProps) {
  const { t } = useLocale()
  const [tab, setTab] = useState<CompanionTab>('snippets')
  const [collapsed, setCollapsed] = useState(() => loadSnippetPanelCollapsed())

  const setCollapsedPersisted = (next: boolean) => {
    setCollapsed(next)
    saveSnippetPanelCollapsed(next)
  }

  if (collapsed) {
    return (
      <aside className="flex w-11 shrink-0 flex-col border-l border-border bg-surface">
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center border-b border-border text-sm text-text-muted transition hover:bg-surface-muted hover:text-text"
          onClick={() => setCollapsedPersisted(false)}
          aria-label={t('terminalCompanion.expand')}
          title={t('terminalCompanion.expand')}
        >
          ‹
        </button>
        <button
          type="button"
          className="mt-2 px-1 text-[10px] font-medium leading-tight text-text-muted"
          onClick={() => {
            setCollapsedPersisted(false)
            setTab('serverOps')
          }}
        >
          {t('serverOps.panelShort')}
        </button>
      </aside>
    )
  }

  return (
    <div className="flex min-h-0 shrink-0">
      <aside className="flex w-9 shrink-0 flex-col items-stretch border-l border-border bg-surface-muted/40">
        <button
          type="button"
          className={`border-b border-border px-1 py-3 text-[10px] font-semibold leading-tight ${
            tab === 'snippets' ? 'bg-surface text-text' : 'text-text-muted hover:bg-surface/80'
          }`}
          onClick={() => setTab('snippets')}
        >
          {t('terminalCompanion.snippets')}
        </button>
        <button
          type="button"
          className={`px-1 py-3 text-[10px] font-semibold leading-tight ${
            tab === 'serverOps' ? 'bg-surface text-text' : 'text-text-muted hover:bg-surface/80'
          }`}
          onClick={() => setTab('serverOps')}
        >
          {t('terminalCompanion.serverOps')}
        </button>
        <div className="mt-auto border-t border-border">
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center text-sm text-text-muted hover:bg-surface hover:text-text"
            onClick={() => setCollapsedPersisted(true)}
            aria-label={t('terminalCompanion.collapse')}
          >
            ›
          </button>
        </div>
      </aside>

      {tab === 'snippets' ? (
        <SnippetPanel mode="terminal" embedded onApply={onApplySnippet} />
      ) : (
        <ServerOpsPanel sessionId={sessionId} connected={connected} onPasteCommand={onPasteCommand} />
      )}
    </div>
  )
}