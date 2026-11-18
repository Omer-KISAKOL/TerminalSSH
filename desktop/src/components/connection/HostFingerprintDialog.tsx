import type { HostVerifyRequestEvent } from '@shared/contracts/host'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type HostFingerprintDialogProps = {
  request: HostVerifyRequestEvent
  isResponding: boolean
  onApprove: () => void
  onReject: () => void
  onDismiss: () => void
}

export function HostFingerprintDialog({
  request,
  isResponding,
  onApprove,
  onReject,
  onDismiss,
}: HostFingerprintDialogProps) {
  const { t } = useLocale()
  const isMismatch = request.kind === 'mismatch'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="host-verify-title"
        className="w-full max-w-lg rounded-xl border border-border bg-surface-muted p-6 shadow-xl"
      >
        <h2
          id="host-verify-title"
          className={`text-base font-medium ${isMismatch ? 'text-status-error' : 'text-text'}`}
        >
          {isMismatch ? t('hostVerify.mismatchTitle') : t('hostVerify.unknownTitle')}
        </h2>

        <p className="mt-2 text-sm text-text-muted">
          {isMismatch ? t('hostVerify.mismatchBody') : t('hostVerify.unknownBody')}
        </p>

        <dl className="mt-4 space-y-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          <div>
            <dt className="text-text-muted">{t('hostVerify.server')}</dt>
            <dd className="font-mono text-text">
              {request.host}:{request.port}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">{t('hostVerify.fingerprint')}</dt>
            <dd className="break-all font-mono text-text">{request.fingerprint}</dd>
          </div>
          {isMismatch && request.expectedFingerprint ? (
            <div>
              <dt className="text-text-muted">{t('hostVerify.savedFingerprint')}</dt>
              <dd className="break-all font-mono text-text">{request.expectedFingerprint}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex justify-end gap-3">
          {isMismatch ? (
            <Button variant="primary" loading={isResponding} onClick={onDismiss}>
              {t('common.close')}
            </Button>
          ) : (
            <>
              <Button variant="secondary" disabled={isResponding} onClick={onReject}>
                {t('hostVerify.reject')}
              </Button>
              <Button variant="primary" loading={isResponding} onClick={onApprove}>
                {t('hostVerify.trust')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}