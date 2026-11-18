import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { AppLocale } from '@shared/i18n/locale'
import { messagesEn, messagesTr, type Messages } from '@/lib/i18n/catalog'
import {
  applyDocumentLocale,
  loadLocale,
  saveLocale,
} from '@/lib/i18n/locale-storage'
import { createTranslator, type Translator } from '@/lib/i18n/translate'

type LocaleContextValue = {
  locale: AppLocale
  messages: Messages
  t: Translator
  setLocale: (locale: AppLocale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const MESSAGE_CATALOG: Record<AppLocale, Messages> = {
  tr: messagesTr,
  en: messagesEn,
}

function syncMenuLocale(locale: AppLocale): void {
  if (typeof window !== 'undefined' && window.desktopApi?.app?.syncLocale) {
    void window.desktopApi.app.syncLocale(locale)
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => loadLocale())

  const setLocale = useCallback((next: AppLocale) => {
    saveLocale(next)
    applyDocumentLocale(next)
    setLocaleState(next)
    syncMenuLocale(next)
  }, [])

  const messages = useMemo(() => MESSAGE_CATALOG[locale], [locale])
  const t = useMemo(() => createTranslator(messages), [messages])

  useEffect(() => {
    applyDocumentLocale(locale)
    syncMenuLocale(locale)
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      messages,
      t,
      setLocale,
    }),
    [locale, messages, setLocale, t],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)

  if (!context) {
    throw new Error('useLocale yalnızca LocaleProvider içinde kullanılabilir.')
  }

  return context
}