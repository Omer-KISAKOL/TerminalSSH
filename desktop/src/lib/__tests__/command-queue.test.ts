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

describe('splitPastedCommands heredoc ve devam satırları', () => {
  it('EOF gövdesini tek komut olarak tutar', () => {
    const text = "cat > a.txt <<'EOF'\nline1\n\nls -la\nEOF\necho done\n"
    expect(splitPastedCommands(text)).toEqual(["cat > a.txt <<'EOF'\nline1\n\nls -la\nEOF", 'echo done'])
  })

  it('<<- ile girintili ayracı tanır', () => {
    const text = 'cat <<-EOF\n\tbody\n\tEOF\nls\n'
    expect(splitPastedCommands(text)).toEqual(['cat <<-EOF\n\tbody\n\tEOF', 'ls'])
  })

  it('tek başına heredoc de tek birim olarak döner', () => {
    expect(splitPastedCommands('cat <<EOF\nhi\nEOF\n')).toEqual(['cat <<EOF\nhi\nEOF'])
  })

  it('ters bölü ve açık tırnak ile devam eden satırları birleştirir', () => {
    expect(splitPastedCommands('apt update && \\\napt upgrade\nls\n')).toEqual([
      'apt update && \\\napt upgrade',
      'ls',
    ])
    expect(splitPastedCommands('echo "a\nb"\nls\n')).toEqual(['echo "a\nb"', 'ls'])
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

describe('CommandQueue tam ekran uygulama (nano/vim)', () => {
  it('tam ekran modunda çok satırlı yapıştırmayı kuyruğa almadan olduğu gibi gönderir', () => {
    const sent: string[] = []
    const queue = new CommandQueue({ send: (data) => void sent.push(data), shouldBypass: () => true })

    queue.handleInput('line1\rline2\rline3\r')

    expect(sent).toEqual(['line1\rline2\rline3\r'])
    expect(queue.getSnapshot().phase).toBe('idle')
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
