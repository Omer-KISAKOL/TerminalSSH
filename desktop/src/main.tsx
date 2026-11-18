import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { applyAppearanceTheme, loadAppearanceThemeId } from '@/lib/appearance-theme'
import { applyDocumentLocale, loadLocale } from '@/lib/i18n/locale-storage'

import App from './App'
import './index.css'

applyAppearanceTheme(loadAppearanceThemeId())
applyDocumentLocale(loadLocale())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
