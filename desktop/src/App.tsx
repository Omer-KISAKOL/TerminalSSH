import { AppShell } from '@/components/layout/AppShell'
import { useAppVersion } from '@/hooks/useAppVersion'

function App() {
  const appVersion = useAppVersion()

  return <AppShell appVersion={appVersion} />
}

export default App
