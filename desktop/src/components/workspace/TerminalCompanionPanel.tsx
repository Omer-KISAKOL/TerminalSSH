import { useState } from 'react'

import { SnippetPanel } from '@/components/snippets/SnippetPanel'
import { ServerOpsPanel } from '@/components/server-ops/ServerOpsPanel'
import { useLocale } from '@/hooks/useLocale'
import { loadSnippetPanelCollapsed, saveSnippetPanelCollapsed } from '@/lib/sidebar-storage'

import {
  TERMINAL_COMPANION_COLLAPSED_CLASS,
  TERMINAL_COMPANION_PANEL_CLASS,
} from './terminal-companion-constants'

type CompanionTab = 'snippets' | 'serverOps'

type TerminalCompanionPanelProps = {
  sessionId: string | null
  connected: boolean
  onApplySnippet: (content: string, appendNewline: boolean) => void
  onPasteCommand: (command: string) => void
}

const tabButtonBase =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-150'

function SnippetTabIcon() {
  return (
    <span className="font-mono text-sm font-semibold leading-none" aria-hidden="true">
      {'{ }'}
    </span>
  )
}

function ServerTabIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2 2.5h12v2.5H2V2.5Zm0 4h12V9H2V6.5Zm0 4.5h9v2.5H2V11Z"
      />
    </svg>
  )
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

  const tabActiveClass = 'border-accent/50 bg-accent/15 text-text'
  const tabIdleClass = 'border-border/70 bg-surface text-text-muted hover:bg-surface-muted hover:text-text'

  if (collapsed) {
    return (
      <aside
        className={`flex ${TERMINAL_COMPANION_COLLAPSED_CLASS} h-full min-h-0 shrink-0 flex-col border-l border-border bg-surface-raised`}
      >
        <button
          type="button"
          className={`${tabButtonBase} mx-1.5 mt-2 border-border/70 text-text-muted hover:bg-surface-muted hover:text-text`}
          onClick={() => setCollapsedPersisted(false)}
          aria-label={t('terminalCompanion.expand')}
          title={t('terminalCompanion.expand')}
        >
          ‹
        </button>
        <button
          type="button"
          className={`${tabButtonBase} mx-1.5 mt-2 ${tab === 'snippets' ? tabActiveClass : tabIdleClass}`}
          onClick={() => {
            setCollapsedPersisted(false)
            setTab('snippets')
          }}
          aria-label={t('snippets.panelTitle')}
          title={t('snippets.panelTitle')}
        >
          <SnippetTabIcon />
        </button>
        <button
          type="button"
          className={`${tabButtonBase} mx-1.5 mt-1.5 ${tab === 'serverOps' ? tabActiveClass : tabIdleClass}`}
          onClick={() => {
            setCollapsedPersisted(false)
            setTab('serverOps')
          }}
          aria-label={t('serverOps.panelTitle')}
          title={t('serverOps.panelTitle')}
        >
          <ServerTabIcon />
        </button>
      </aside>
    )
  }

  return (
    <aside
      className={`flex ${TERMINAL_COMPANION_PANEL_CLASS} h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-border bg-surface-raised`}
    >
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-2 py-2">
        <button
          type="button"
          className={`${tabButtonBase} ${tab === 'snippets' ? tabActiveClass : tabIdleClass}`}
          onClick={() => setTab('snippets')}
          aria-label={t('snippets.panelTitle')}
          title={t('snippets.panelTitle')}
          aria-pressed={tab === 'snippets'}
        >
          <SnippetTabIcon />
        </button>
        <button
          type="button"
          className={`${tabButtonBase} ${tab === 'serverOps' ? tabActiveClass : tabIdleClass}`}
          onClick={() => setTab('serverOps')}
          aria-label={t('serverOps.panelTitle')}
          title={t('serverOps.panelTitle')}
          aria-pressed={tab === 'serverOps'}
        >
          <ServerTabIcon />
        </button>
        <InputSpacer className="flex-1" />
        <button
          type="button"
          className={`${tabButtonBase} border-border/70 text-text-muted hover:bg-surface-muted hover:text-text`}
          onClick={() => setCollapsedPersisted(true)}
          aria-label={t('terminalCompanion.collapse')}
          title={t('terminalCompanion.collapse')}
        >
          ›
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === 'snippets' ? (
          <SnippetPanel mode="terminal" embedded onApply={onApplySnippet} />
        ) : (
          <ServerOpsPanel
            sessionId={sessionId}
            connected={connected}
            embedded
            onPasteCommand={onPasteCommand}
          />
        )}
      </div>
    </aside>
  )
}

function InputSpacer({ className }: { className: string }) {
  return <span className={className} aria-hidden="true" />
}