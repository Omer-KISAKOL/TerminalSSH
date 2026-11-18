import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import {
  applyAppearanceTheme,
  getAppearanceTheme,
  loadAppearanceThemeId,
  saveAppearanceThemeId,
  type AppearanceTheme,
  type AppearanceThemeId,
} from '@/lib/appearance-theme'

type AppearanceThemeContextValue = {
  themeId: AppearanceThemeId
  theme: AppearanceTheme
  setThemeId: (id: AppearanceThemeId) => void
}

const AppearanceThemeContext = createContext<AppearanceThemeContextValue | null>(null)

export function AppearanceThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<AppearanceThemeId>(() => loadAppearanceThemeId())

  const setThemeId = useCallback((id: AppearanceThemeId) => {
    saveAppearanceThemeId(id)
    applyAppearanceTheme(id)
    setThemeIdState(id)
  }, [])

  const theme = useMemo(() => getAppearanceTheme(themeId), [themeId])

  const value = useMemo(
    () => ({
      themeId,
      theme,
      setThemeId,
    }),
    [theme, themeId, setThemeId],
  )

  return <AppearanceThemeContext.Provider value={value}>{children}</AppearanceThemeContext.Provider>
}

export function useAppearanceTheme(): AppearanceThemeContextValue {
  const context = useContext(AppearanceThemeContext)

  if (!context) {
    throw new Error('useAppearanceTheme yalnızca AppearanceThemeProvider içinde kullanılabilir.')
  }

  return context
}