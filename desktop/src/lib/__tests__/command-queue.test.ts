import { describe, expect, it } from 'vitest'

import { CommandQueue, isShellPrompt, lastVisibleLine, splitPastedCommands } from '../command-queue'

function createHarness() {
  const sent: string[] = []
  const local: string[] = []
  const timers: Array<{ callback: () => void; cancelled: boolean }> = []

  const queue = new CommandQueue({
    send: (data) => {
      sent.push(data)
    },
    writeLocal: (data) => {
      local.push(data)
    },
    schedule: (callback) => {
      const timer = { callback, cancelled: false }
      timers.push(timer)
      return () => {
        timer.cancelled = true
      }
    },
  })

  return {
    queue,
    sent,
    local,
    flush() {
      const pending = timers.filter((timer) => !timer.cancelled)
      timers.length = 0
      for (const timer of pending) {
        timer.callback()
      }
    },
  }
}

describe('splitPastedCommands', () => {
  it('tek satırı ve Enter tuşunu kuyruğa almaz', () => {
    expect(splitPastedCommands('git status')).toBeNull()
    expect(splitPastedCommands('git status\n')).toBeNull()
    expect(splitPastedCommands('\r')).toBeNull()
  })

  it('alt alta komutları ayırır', () => {
    expect(splitPastedCommands('git pull\necho hi\nls\n')).toEqual(['git pull', 'echo hi', 'ls'])
  })
})

describe('isShellPrompt', () => {
  it('kabuk istemini tanır', () => {
    expect(isShellPrompt('user@host:~$')).toBe(true)
    expect(isShellPrompt('root@host:~#')).toBe(true)
    expect(isShellPrompt("Username for 'https://github.com':")).toBe(false)
    expect(isShellPrompt('Password:')).toBe(false)
    expect(isShellPrompt('user@host:~$ git pull')).toBe(false)
  })
})

describe('lastVisibleLine', () => {
  it('son görünür satırı ve ANSI kodlarını çözer', () => {
    expect(lastVisibleLine('git pull\r\n\u001b[32muser@host:~$\u001b[0m')).toBe('user@host:~$')
    expect(lastVisibleLine('progress 10%\rprogress 20%')).toBe('progress 20%')
  })
})

describe('CommandQueue', () => {
  it('çok satırlı yapıştırmayı Enter ile başlatır ve komut bitmeden sıradakini göndermez', () => {
    const { queue, sent, flush } = createHarness()

    queue.handleInput('git pull\necho hi\n')
    expect(sent).toEqual([])

    queue.handleInput('\r')
    expect(sent).toEqual(['\u0015git pull\r'])

    queue.observeOutput("git pull\r\nUsername for 'https://github.com': ")
    flush()
    expect(sent).toEqual(['\u0015git pull\r'])

    queue.observeOutput('\r\nuser@host:~$ ')
    flush()
    expect(sent).toEqual(['\u0015git pull\r', '\u0015echo hi\r'])
  })

  it('Esc ile bekleyen komutları iptal eder', () => {
    const { queue, sent } = createHarness()

    queue.handleInput('git pull\nls\n')
    queue.handleInput('\u001b')

    expect(queue.getSnapshot().phase).toBe('idle')
    expect(sent).toEqual([])
  })

  it('Ctrl+C kalan komutları düşürür', () => {
    const { queue, sent, flush } = createHarness()

    queue.handleInput('git pull\necho hi\n', { autoStart: true })
    expect(sent).toEqual(['\u0015git pull\r'])

    queue.handleInput('\u0003')
    queue.observeOutput('\r\nuser@host:~$ ')
    flush()

    expect(sent).toEqual(['\u0015git pull\r', '\u0003'])
    expect(queue.getSnapshot().phase).toBe('idle')
  })
})
