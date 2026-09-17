import { useCallback, useEffect, useRef, useState } from 'react'

import type { HostVerifyRequestEvent } from '@shared/contracts/host'

type UseHostVerificationResult = {
  pendingRequest: HostVerifyRequestEvent | null
  isResponding: boolean
  approve: () => Promise<void>
  reject: () => Promise<void>
  dismiss: () => void
}

export function useHostVerification(): UseHostVerificationResult {
  const [pendingRequest, setPendingRequest] = useState<HostVerifyRequestEvent | null>(null)
  const [isResponding, setIsResponding] = useState(false)
  const pendingRequestRef = useRef<HostVerifyRequestEvent | null>(null)
  const listenerRegisteredRef = useRef(false)

  useEffect(() => {
    pendingRequestRef.current = pendingRequest
  }, [pendingRequest])

  useEffect(() => {
    if (listenerRegisteredRef.current) {
      return
    }

    listenerRegisteredRef.current = true

    const unsubscribe = window.desktopApi.ssh.onHostVerifyRequest((request) => {
      setPendingRequest((current) => {
        if (current?.verificationId === request.verificationId) {
          return current
        }

        return request
      })
    })

    return () => {
      listenerRegisteredRef.current = false
      unsubscribe()
    }
  }, [])

  const respond = useCallback(async (approved: boolean) => {
    const request = pendingRequestRef.current

    if (!request || request.kind === 'mismatch') {
      return
    }

    setIsResponding(true)

    try {
      await window.desktopApi.ssh.respondHostVerification(request.verificationId, approved)
    } finally {
      setIsResponding(false)
      setPendingRequest(null)
      pendingRequestRef.current = null
    }
  }, [])

  const approve = useCallback(async () => {
    await respond(true)
  }, [respond])

  const reject = useCallback(async () => {
    await respond(false)
  }, [respond])

  const dismiss = useCallback(() => {
    setPendingRequest(null)
    pendingRequestRef.current = null
  }, [])

  return {
    pendingRequest,
    isResponding,
    approve,
    reject,
    dismiss,
  }
}
