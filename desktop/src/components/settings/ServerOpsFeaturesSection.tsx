import { useServerOpsFeatures } from '@/hooks/useServerOpsFeatures'
import { useLocale } from '@/hooks/useLocale'

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
          title={t('settings.serverToolsDependencyTitle')}
          description={t('settings.serverToolsDependencyHelp')}
          enabled={features.dependencyIntelligence}
          onChange={features.setDependencyIntelligence}
        />
        <FeatureToggle
          title={t('settings.serverToolsProcessTitle')}
          description={t('settings.serverToolsProcessHelp')}
          enabled={features.processExplorer}
          onChange={features.setProcessExplorer}
        />
        <FeatureToggle
          title={t('settings.serverToolsDiskTitle')}
          description={t('settings.serverToolsDiskHelp')}
          enabled={features.diskSpaceAnalyzer}
          onChange={features.setDiskSpaceAnalyzer}
        />
        <FeatureToggle
          title={t('settings.serverToolsDriftTitle')}
          description={t('settings.serverToolsDriftHelp')}
          enabled={features.configDriftDetector}
          onChange={features.setConfigDriftDetector}
        />
        <FeatureToggle
          title={t('settings.serverToolsEnvTitle')}
          description={t('settings.serverToolsEnvHelp')}
          enabled={features.environmentInspector}
          onChange={features.setEnvironmentInspector}
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