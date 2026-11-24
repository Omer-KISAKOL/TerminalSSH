import { useEffect, useState } from 'react'

import { useLocale } from '@/hooks/useLocale'

function isElectronDesktop(): boolean {
  return typeof window !== 'undefined' && window.desktopApi != null
}

/** Windows 11 tarzı krom — tema yeşilinden bağımsız nötr ikon rengi */
const btnClass =
  'titlebar-no-drag window-chrome-btn inline-flex h-11 w-10 items-center justify-center rounded-none border-0 bg-transparent shadow-none transition-colors duration-150 hover:bg-white/[0.06] active:bg-white/[0.1]'

const iconClass = 'pointer-events-none block h-[11px] w-[11px]'

function MinimizeIcon() {
  return (
    <svg viewBox="0 0 11 11" className={iconClass} aria-hidden="true">
      <path d="M1.5 9.5h8" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg viewBox="0 0 11 11" className={iconClass} aria-hidden="true" fill="none">
      <rect
        x="2"
        y="2"
        width="7"
        height="7"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 11 11" className={iconClass} aria-hidden="true">
      <path
        d="M2 2l7 7M9 2L2 9"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function WindowControls() {
  const { t } = useLocale()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!isElectronDesktop()) {
      return
    }

    const app = window.desktopApi.app
    if (typeof app.windowIsMaximized !== 'function') {
      return
    }

    void app.windowIsMaximized().then(setMaximized)

    const unsubscribe = app.onWindowMaximizeChanged?.(setMaximized)
    return () => {
      unsubscribe?.()
    }
  }, [])

  if (!isElectronDesktop()) {
    return null
  }

  const app = window.desktopApi.app

  return (
    <div
      className="titlebar-no-drag relative z-30 -mr-2 ml-2 flex h-11 shrink-0 items-stretch gap-0 md:-mr-3"
      role="toolbar"
      aria-label={t('window.controls')}
    >
      <button type="button" className={btnClass} aria-label={t('window.minimize')} onClick={() => void app.windowMinimize?.()}>
        <MinimizeIcon />
      </button>
      <button
        type="button"
        className={btnClass}
        aria-label={maximized ? t('window.restore') : t('window.maximize')}
        onClick={() => {
          void app.windowToggleMaximize?.().then((value) => {
            if (typeof value === 'boolean') {
              setMaximized(value)
            }
          })
        }}
      >
        <MaximizeIcon />
      </button>
      <button
        type="button"
        className={`${btnClass} hover:bg-[#e81123] hover:text-white active:bg-[#bf0a1d] active:text-white`}
        aria-label={t('window.close')}
        onClick={() => void app.windowClose?.()}
      >
        <CloseIcon />
      </button>
    </div>
  )
}