import type { Terminal } from '@xterm/xterm'

/**
 * Fare ve tekerlek davranışı xterm.js'e bırakılır: uzak uygulama (nano, vim, htop...)
 * fare raporlamasını kendisi açarsa xterm olayları iletir; açmazsa alternatif ekranda
 * tekerlek ok tuşlarına çevrilir. Yerel olarak fare modunu zorlamak veya sahte
 * imleç konumu (CPR) göndermek ekrana "0;79;34M" gibi çöp karakterler basar.
 */
export function isFullScreenTerminal(terminal: Terminal): boolean {
  return terminal.buffer.active.type === 'alternate'
}
