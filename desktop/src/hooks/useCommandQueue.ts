import { useEffect, useRef, useState } from 'react'

import {
  CommandQueue,
  IDLE_SNAPSHOT,
  type CommandQueueInputOptions,
  type CommandQueueSnapshot,
} from '@/lib/command-queue'

/* oxlint-disable react/refs -- CommandQueue is a stable imperative controller. */
export function useCommandQueue(send: (data: string) => void) {
  const sendRef = useRef(send)
  const writeLocalRef = useRef<(data: string) => void>(() => {})
  const [snapshot, setSnapshot] = useState<CommandQueueSnapshot>(IDLE_SNAPSHOT)
  const queueRef = useRef<CommandQueue | null>(null)

  if (queueRef.current === null) {
    queueRef.current = new CommandQueue({
      send: (data) => {
        sendRef.current(data)
      },
      writeLocal: (data) => {
        writeLocalRef.current(data)
      },
      onChange: setSnapshot,
    })
  }

  const queue = queueRef.current
  sendRef.current = send

  useEffect(() => {
    return () => {
      queue.dispose()
    }
  }, [queue])

  return {
    snapshot,
    handleInput: queue.handleInput,
    observeOutput: queue.observeOutput,
    begin: queue.begin,
    cancel: queue.cancel,
    dropPending: queue.dropPending,
    setWriteLocal(writeLocal: (data: string) => void) {
      writeLocalRef.current = writeLocal
    },
  }
}

/* oxlint-enable react/refs */
export type { CommandQueueInputOptions }
