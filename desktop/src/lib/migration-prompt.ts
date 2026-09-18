const KEY_PREFIX = 'terminalssh:migration-prompt-dismissed:'

export function isMigrationPromptDismissed(userId: string): boolean {
  try {
    return localStorage.getItem(`${KEY_PREFIX}${userId}`) === '1'
  } catch {
    return false
  }
}

export function dismissMigrationPrompt(userId: string): void {
  try {
    localStorage.setItem(`${KEY_PREFIX}${userId}`, '1')
  } catch {
    // localStorage kullanılamıyorsa sessizce geç
  }
}
