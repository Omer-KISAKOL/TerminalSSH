const TECHNICAL_PATTERNS = [
  /\n\s+at\s+/,
  /\bat\s+[\w./<>]+:\d+:\d+/,
  /node_modules[/\\]/,
  /dist-electron[/\\]/,
  /\[object Object\]/,
]

function unwrapIpcInvokeError(message: string): string {
  if (!message.startsWith('Error invoking remote method ')) {
    return message
  }

  const marker = ': Error: '
  const markerIndex = message.lastIndexOf(marker)

  if (markerIndex >= 0) {
    return message.slice(markerIndex + marker.length).trim()
  }

  return message
}

export function toUserErrorMessage(error: unknown, fallback = 'Bağlantı kurulamadı.'): string {
  if (!(error instanceof Error)) {
    return fallback
  }

  const message = unwrapIpcInvokeError(error.message.trim())

  if (message.length === 0) {
    return fallback
  }

  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(message))) {
    return fallback
  }

  const firstLine = message.split('\n')[0]?.trim() ?? fallback

  if (firstLine.length > 180) {
    return fallback
  }

  return firstLine
}
