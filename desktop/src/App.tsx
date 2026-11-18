import { AppShell } from '@/components/layout/AppShell'
import { AppearanceThemeProvider } from '@/hooks/useAppearanceTheme'
import { useAppVersion } from '@/hooks/useAppVersion'
import { LocaleProvider } from '@/hooks/useLocale'

function App() {
  const appVersion = useAppVersion()

  return (
    <LocaleProvider>
      <AppearanceThemeProvider>
        <AppShell appVersion={appVersion} />
      </AppearanceThemeProvider>
    </LocaleProvider>
  )
}

export default App
