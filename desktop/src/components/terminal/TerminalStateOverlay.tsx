import type { ConnectionStatus } from '@shared/contracts/ssh'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

type TerminalStateOverlayProps = {
  status: ConnectionStatus
  errorMessage: string | null
  onReconnect: () => void
  onBackToForm: () => void
  isReconnecting?: boolean
}

export function TerminalStateOverlay({
  status,
  errorMessage,
  onReconnect,
  onBackToForm,
  isReconnecting = false,
}: TerminalStateOverlayProps) {
  if (status === 'connecting' || status === 'disconnecting') {
    return (
      <div
        className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <EmptyState
          title={status === 'connecting' ? 'Sunucuya bağlanılıyor' : 'Bağlantı kesiliyor'}
          description={
            status === 'connecting'
              ? 'Kimlik doğrulama ve host anahtarı kontrolü yapılıyor. Lütfen bekleyin.'
              : 'SSH oturumu güvenli şekilde sonlandırılıyor.'
          }
          icon={
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-r-transparent" />
          }
        />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/85 backdrop-blur-sm">
        <EmptyState
          title="Bağlantı kurulamadı"
          description={errorMessage ?? 'Sunucuya bağlanırken bir hata oluştu.'}
          icon={<span className="text-xl text-status-error">!</span>}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" loading={isReconnecting} onClick={onReconnect}>
                Yeniden Dene
              </Button>
              <Button variant="secondary" onClick={onBackToForm}>
                Bağlantı Formuna Dön
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  if (status === 'disconnected') {
    return (
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-surface-raised/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-muted">SSH oturumu sona erdi.</p>
          <div className="flex gap-2">
            <Button variant="primary" loading={isReconnecting} onClick={onReconnect}>
              Yeniden Bağlan
            </Button>
            <Button variant="secondary" onClick={onBackToForm}>
              Yeni Bağlantı
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
