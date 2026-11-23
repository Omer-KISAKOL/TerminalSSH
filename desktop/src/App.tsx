import { UpdateAvailableDialog } from '@/components/app/UpdateAvailableDialog'
import { AppShell } from '@/components/layout/AppShell'
import { AppearanceThemeProvider } from '@/hooks/useAppearanceTheme'
import { useAppUpdateCheck } from '@/hooks/useAppUpdateCheck'
import { useAppVersion } from '@/hooks/useAppVersion'
import { LocaleProvider } from '@/hooks/useLocale'

function App() {
  const appVersion = useAppVersion()
  const { update, dismiss, install } = useAppUpdateCheck(true)

  return (
    <LocaleProvider>
      <AppearanceThemeProvider>
        <AppShell appVersion={appVersion} />
        {update ? (
          <UpdateAvailableDialog
            update={update}
            onDismiss={dismiss}
            onInstall={() => void install()}
          />
        ) : null}
      </AppearanceThemeProvider>
    </LocaleProvider>
  )
}

export default App
