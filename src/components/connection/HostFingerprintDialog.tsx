import type { HostVerifyRequestEvent } from '@shared/contracts/host'

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
          className={`text-base font-medium ${isMismatch ? 'text-status-error' : 'text-white'}`}
        >
          {isMismatch ? 'Güvenlik uyarısı: Sunucu kimliği değişti' : 'Bilinmeyen sunucu kimliği'}
        </h2>

        <p className="mt-2 text-sm text-text-muted">
          {isMismatch
            ? 'Bu sunucunun anahtar parmak izi daha önce kaydedilenden farklı. Bağlantı güvenlik nedeniyle durduruldu.'
            : 'Bu sunucuya ilk kez bağlanıyorsunuz. Devam etmeden önce parmak izini doğrulayın.'}
        </p>

        <dl className="mt-4 space-y-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          <div>
            <dt className="text-text-muted">Sunucu</dt>
            <dd className="font-mono text-text">
              {request.host}:{request.port}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Parmak izi</dt>
            <dd className="break-all font-mono text-text">{request.fingerprint}</dd>
          </div>
          {isMismatch && request.expectedFingerprint ? (
            <div>
              <dt className="text-text-muted">Kayıtlı parmak izi</dt>
              <dd className="break-all font-mono text-text">{request.expectedFingerprint}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex justify-end gap-3">
          {isMismatch ? (
            <button
              type="button"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
              disabled={isResponding}
              onClick={onDismiss}
            >
              Kapat
            </button>
          ) : (
            <>
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-surface disabled:opacity-50"
                disabled={isResponding}
                onClick={onReject}
              >
                Reddet
              </button>
              <button
                type="button"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
                disabled={isResponding}
                onClick={onApprove}
              >
                Güven ve devam et
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
