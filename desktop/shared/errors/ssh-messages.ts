export const SSH_ERROR_MESSAGES = {
  HOST_UNREACHABLE: 'Sunucuya ulaşılamadı.',
  DNS_ERROR: 'Sunucu adresi çözümlenemedi.',
  CONNECTION_REFUSED: 'Bağlantı reddedildi.',
  TIMEOUT: 'Bağlantı zaman aşımına uğradı.',
  AUTH_FAILED: 'Kullanıcı adı veya parola hatalı.',
  PRIVATE_KEY_ERROR: 'Özel anahtar okunamadı.',
  FINGERPRINT_MISMATCH: 'Sunucunun kimliği daha önce kaydedilenden farklı.',
  HOST_REJECTED: 'Sunucu kimliği onaylanmadı.',
  HOST_VERIFY_TIMEOUT: 'Sunucu kimliği onayı zaman aşımına uğradı.',
  PERMISSION_DENIED: 'Bağlantı izni reddedildi.',
  GENERIC: 'Bağlantı kurulamadı.',
} as const

export type SshErrorMessage =
  (typeof SSH_ERROR_MESSAGES)[keyof typeof SSH_ERROR_MESSAGES]
