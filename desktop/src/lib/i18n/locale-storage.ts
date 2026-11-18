import type { AppLocale } from '@shared/i18n/locale'
import { DEFAULT_APP_LOCALE } from '@shared/i18n/locale'

const STORAGE_KEY = 'terminalssh-locale'

export function detectDefaultLocale(): AppLocale {
  if (typeof navigator !== 'undefined') {
    const language = navigator.language.toLowerCase()
    if (language.startsWith('tr')) {
      return 'tr'
    }
    if (language.startsWith('en')) {
      return 'en'
    }
  }

  return DEFAULT_APP_LOCALE
}

export function loadLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw === 'tr' || raw === 'en') {
      return raw
    }
  } catch {
    // localStorage kullanılamıyorsa
  }

  return detectDefaultLocale()
}

export function saveLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // sessizce geç
  }
}

export function applyDocumentLocale(locale: AppLocale): void {
  document.documentElement.lang = locale
}