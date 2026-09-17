export function mapSshError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Bağlantı kurulamadı.'
  }

  const value = error as { code?: string; level?: string; message?: string }

  switch (value.code) {
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
    case 'ECONNREFUSED':
    case 'EHOSTUNREACH':
    case 'ENETUNREACH':
      return 'Sunucuya ulaşılamadı.'
    case 'ETIMEDOUT':
    case 'ECONNRESET':
      return 'Bağlantı zaman aşımına uğradı.'
    case 'EACCES':
    case 'EPERM':
      return 'Bağlantı izni reddedildi.'
    default:
      break
  }

  const message = value.message?.toLowerCase() ?? ''

  if (
    message.includes('authentication failed') ||
    message.includes('all configured authentication methods failed')
  ) {
    return 'Kullanıcı adı veya parola hatalı.'
  }

  if (message.includes('timed out') || message.includes('timeout')) {
    return 'Bağlantı zaman aşımına uğradı.'
  }

  if (message.includes('connect') && message.includes('refused')) {
    return 'Sunucuya ulaşılamadı.'
  }

  return 'Bağlantı kurulamadı.'
}
