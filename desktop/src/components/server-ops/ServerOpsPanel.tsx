import { useEffect, useState } from 'react'

import type { ContextCommandSuggestion } from '@shared/contracts/server-ops'

import { useServerOps } from '@/hooks/useServerOps'
import { useLocale } from '@/hooks/useLocale'

import { ContextSuggestionsView } from './ContextSuggestionsView'
import { OperationalTimelineView } from './OperationalTimelineView'
import { ServerIntelligenceView } from './ServerIntelligenceView'

type ServerOpsTab = 'intelligence' | 'timeline' | 'context'

type ServerOpsPanelProps = {
  sessionId: string | null
  connected: boolean
  embedded?: boolean
  onPasteCommand: (command: string) => void
}

const TAB_CLASS_ACTIVE =
  'border-accent bg-accent/15 text-text shadow-[inset_0_0_0_1px_rgba(var(--color-accent-rgb),0.25)]'
const TAB_CLASS_IDLE = 'border-transparent text-text-muted hover:bg-surface-muted hover:text-text'

export function ServerOpsPanel({
  sessionId,
  connected,
  embedded = false,
  onPasteCommand,
}: ServerOpsPanelProps) {
  const { t } = useLocale()
  const [tab, setTab] = useState<ServerOpsTab>('intelligence')
  const ops = useServerOps(sessionId, connected)

  useEffect(() => {
    if (
      tab === 'intelligence' &&
      connected &&
      sessionId &&
      !ops.snapshot &&
      !ops.isCollecting &&
      !ops.isLoading
    ) {
      void ops.collectIntelligence()
    }
  }, [
    connected,
    ops.collectIntelligence,
    ops.isCollecting,
    ops.isLoading,
    ops.snapshot,
    sessionId,
    tab,
  ])

  const handleApprovePaste = async (suggestion: ContextCommandSuggestion) => {
    onPasteCommand(suggestion.command)
    await ops.recordSuggestion(suggestion)
  }

  const rootClass = embedded
    ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-surface-raised'
    : 'flex w-80 min-h-0 shrink-0 flex-col border-l border-border bg-surface lg:w-96'

  if (!connected || !sessionId) {
    return (
      <aside className={rootClass}>
        {!embedded ? (
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text">{t('serverOps.panelTitle')}</h2>
          </div>
        ) : null}
        <p className="p-4 text-sm text-text-muted">{t('serverOps.panelDisconnected')}</p>
      </aside>
    )
  }

  return (
    <aside className={rootClass}>
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        {!embedded ? (
          <h2 className="px-1 text-sm font-semibold text-text">{t('serverOps.panelTitle')}</h2>
        ) : null}
        {ops.context ? (
          <p
            className={
              embedded
                ? 'truncate px-1 text-sm font-medium text-text'
                : 'mt-0.5 truncate px-1 text-xs text-text-muted'
            }
          >
            {ops.context.host}
          </p>
        ) : null}
      </div>

      <nav className="grid grid-cols-3 gap-1 border-b border-border px-2 py-2" aria-label={t('serverOps.panelTitle')}>
        {(['intelligence', 'timeline', 'context'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium leading-tight transition ${
              tab === key ? TAB_CLASS_ACTIVE : TAB_CLASS_IDLE
            }`}
            onClick={() => setTab(key)}
          >
            {t(`serverOps.tabs.${key}`)}
          </button>
        ))}
      </nav>

      <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
        {ops.error ? (
          <p className="mb-2 rounded-lg border border-status-error/35 bg-status-error/10 px-2 py-1.5 text-xs text-status-error">
            {ops.error}
          </p>
        ) : null}

        {tab === 'intelligence' ? (
          <ServerIntelligenceView
            snapshot={ops.snapshot}
            isCollecting={ops.isCollecting}
            onCollect={() => void ops.collectIntelligence()}
          />
        ) : null}

        {tab === 'timeline' ? (
          <OperationalTimelineView
            events={ops.timeline}
            retentionDays={ops.retentionDays}
            isLoading={ops.isLoading}
            onRefresh={() => void ops.refreshTimeline()}
          />
        ) : null}

        {tab === 'context' ? (
          <ContextSuggestionsView
            suggestions={ops.suggestions}
            onApprovePaste={handleApprovePaste}
          />
        ) : null}
      </div>
    </aside>
  )
}