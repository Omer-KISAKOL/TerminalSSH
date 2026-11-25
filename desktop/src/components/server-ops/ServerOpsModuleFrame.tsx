import type { ReactNode } from 'react'

import { Button } from '@/components/ui/Button'

type ServerOpsModuleFrameProps = {
  title: string
  subtitle: string
  isCollecting: boolean
  hasSnapshot: boolean
  onCollect: () => void
  refreshLabel: string
  startLabel: string
  children: ReactNode
}

export function ServerOpsModuleFrame({
  title,
  subtitle,
  isCollecting,
  hasSnapshot,
  onCollect,
  refreshLabel,
  startLabel,
  children,
}: ServerOpsModuleFrameProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-text">{title}</h3>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
        <Button
          type="button"
          className="shrink-0 px-2.5 py-1.5 text-xs"
          disabled={isCollecting}
          onClick={onCollect}
        >
          {hasSnapshot ? refreshLabel : startLabel}
        </Button>
      </div>
      {children}
    </div>
  )
}