import { useServerOpsFeatures } from '@/hooks/useServerOpsFeatures'
import { useLocale } from '@/hooks/useLocale'

function EnableAllIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 12.5l2.5 2.5 5.5-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DisableAllIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function ServerOpsBulkActions({
  onEnableAll,
  onDisableAll,
  enableLabel,
  disableLabel,
}: {
  onEnableAll: () => void
  onDisableAll: () => void
  enableLabel: string
  disableLabel: string
}) {
  return (
    <div
      className="grid w-full grid-cols-2 gap-2"
      role="group"
      aria-label={`${enableLabel} / ${disableLabel}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-status-connected/12 px-2 py-1.5 text-xs font-medium text-text transition hover:bg-status-connected/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-connected/40"
        onClick={onEnableAll}
      >
        <span className="text-status-connected">
          <EnableAllIcon />
        </span>
        <span>{enableLabel}</span>
      </button>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-status-error/12 px-2 py-1.5 text-xs font-medium text-status-error transition hover:bg-status-error/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-error/40"
        onClick={onDisableAll}
      >
        <span className="text-status-error">
          <DisableAllIcon />
        </span>
        <span>{disableLabel}</span>
      </button>
    </div>
  )
}

function FeatureToggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      className="flex w-full items-start justify-between gap-4 rounded-xl border border-border bg-surface-muted/50 px-4 py-4 text-left transition hover:bg-surface-muted"
      onClick={() => onChange(!enabled)}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{title}</p>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      <span
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition ${
          enabled ? 'border-accent bg-accent/30' : 'border-border bg-surface'
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-text shadow transition ${
            enabled ? 'left-[1.35rem] bg-surface-raised' : 'left-0.5 bg-text-muted'
          }`}
        />
      </span>
    </button>
  )
}

type ServerOpsFeaturesSectionProps = {
  panelMode?: boolean
}

export function ServerOpsFeaturesSection({ panelMode = false }: ServerOpsFeaturesSectionProps) {
  const { t } = useLocale()
  const features = useServerOpsFeatures()

  return (
    <div className={panelMode ? 'flex flex-col gap-4' : 'space-y-4 px-5 py-4'}>
      <ServerOpsBulkActions
        enableLabel={t('settings.serverToolsEnableAll')}
        disableLabel={t('settings.serverToolsDisableAll')}
        onEnableAll={features.enableAll}
        onDisableAll={features.disableAll}
      />
      <div className="flex flex-col gap-3">
        <FeatureToggle
          title={t('settings.serverToolsStatusTitle')}
          description={t('settings.serverToolsStatusHelp')}
          enabled={features.intelligence}
          onChange={features.setIntelligence}
        />
        <FeatureToggle
          title={t('settings.serverToolsTimelineTitle')}
          description={t('settings.serverToolsTimelineHelp')}
          enabled={features.timeline}
          onChange={features.setTimeline}
        />
        <FeatureToggle
          title={t('settings.serverToolsContextTitle')}
          description={t('settings.serverToolsContextHelp')}
          enabled={features.context}
          onChange={features.setContext}
        />
        <FeatureToggle
          title={t('settings.serverToolsProcessTitle')}
          description={t('settings.serverToolsProcessHelp')}
          enabled={features.processExplorer}
          onChange={features.setProcessExplorer}
        />
        <FeatureToggle
          title={t('settings.serverToolsEndpointsTitle')}
          description={t('settings.serverToolsEndpointsHelp')}
          enabled={features.endpointMonitor}
          onChange={features.setEndpointMonitor}
        />
        <FeatureToggle
          title={t('settings.serverToolsIncidentTitle')}
          description={t('settings.serverToolsIncidentHelp')}
          enabled={features.incidentAnalyzer}
          onChange={features.setIncidentAnalyzer}
        />
      </div>
    </div>
  )
}