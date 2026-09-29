export const COMMAND_QUEUE_IDLE_MS = 400

const ESC = '\u001b'
const BEL = '\u0007'
const ANSI_PATTERN = new RegExp(
  `${ESC}(?:\\[[0-9;?]*[ -/]*[@-~]|\\][^${BEL}]*(?:${BEL}|${ESC}\\\\)|[@-Z\\\\-_])`,
  'g',
)

export type CommandQueuePhase = 'idle' | 'preview' | 'running'

export type CommandQueueSnapshot = {
  phase: CommandQueuePhase
  lines: string[]
  activeIndex: number
}

export type CommandQueueInputOptions = {
  autoStart?: boolean
}

type CommandQueueOptions = {
  send: (data: string) => void
  writeLocal?: (data: string) => void
  onChange?: (snapshot: CommandQueueSnapshot) => void
  schedule?: (callback: () => void, delayMs: number) => () => void
  idleMs?: number
}

const IDLE_SNAPSHOT: CommandQueueSnapshot = {
  phase: 'idle',
  lines: [],
  activeIndex: 0,
}

export function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, '')
}

export function splitPastedCommands(text: string): string[] | null {
  if (text === '\r' || text === '\n' || text === '\r\n') {
    return null
  }

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (!normalized.includes('\n')) {
    return null
  }

  const rawLines = normalized.split('\n')

  if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
    rawLines.pop()
  }

  const lines = rawLines
    .map((line) => line.replace(/\s+$/u, ''))
    .filter((line) => line.trim().length > 0)

  if (lines.length <= 1) {
    return null
  }

  return lines
}

export function lastVisibleLine(raw: string): string {
  const clean = stripAnsi(raw)
  const rows = clean.split('\n')

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const visible = (rows[index] ?? '').split('\r').pop() ?? ''

    if (visible.trim().length > 0) {
      return visible.replace(/\s+$/u, '')
    }
  }

  return ''
}

export function isShellPrompt(line: string): boolean {
  const trimmed = line.trim()

  if (trimmed.length === 0 || trimmed.length > 160) {
    return false
  }

  if (/(?:\$|#|%|❯|➜)\s*$/u.test(trimmed)) {
    return true
  }

  return /(?:PS [A-Za-z]:|[@:~\\/].*)>\s*$/u.test(trimmed)
}

function isSubmitKey(data: string): boolean {
  if (data.length === 0) {
    return false
  }

  for (const char of data) {
    if (char !== '\r' && char !== '\n') {
      return false
    }
  }

  return true
}

function visibleCommand(line: string): string {
  let result = ''

  for (const char of line) {
    const code = char.charCodeAt(0)

    if (code === 9 || code >= 32) {
      result += char
    }
  }

  return result
}

export class CommandQueue {
  private phase: CommandQueuePhase = 'idle'
  private lines: string[] = []
  private activeIndex = 0
  private output = ''
  private sawNewline = false
  private previewDrawn = false
  private idleCancel: (() => void) | null = null

  private readonly send: (data: string) => void
  private readonly writeLocal: (data: string) => void
  private readonly onChange?: (snapshot: CommandQueueSnapshot) => void
  private readonly schedule: (callback: () => void, delayMs: number) => () => void
  private readonly idleMs: number

  constructor(options: CommandQueueOptions) {
    this.send = options.send
    this.writeLocal = options.writeLocal ?? (() => {})
    this.onChange = options.onChange
    this.schedule =
      options.schedule ??
      ((callback, delayMs) => {
        const timer = setTimeout(callback, delayMs)
        return () => clearTimeout(timer)
      })
    this.idleMs = options.idleMs ?? COMMAND_QUEUE_IDLE_MS
  }

  getSnapshot(): CommandQueueSnapshot {
    return {
      phase: this.phase,
      lines: [...this.lines],
      activeIndex: this.activeIndex,
    }
  }

  handleInput = (data: string, options?: CommandQueueInputOptions): void => {
    const pasted = splitPastedCommands(data)

    if (pasted) {
      if (this.phase === 'running') {
        this.lines = [...this.lines, ...pasted]
        this.emit()
        return
      }

      this.clearPreview()
      this.lines = pasted
      this.activeIndex = 0

      if (options?.autoStart) {
        this.phase = 'running'
        this.emit()
        this.dispatchCurrent()
        return
      }

      this.phase = 'preview'
      this.renderPreview()
      this.emit()
      return
    }

    if (this.phase === 'preview') {
      if (isSubmitKey(data)) {
        this.begin()
        return
      }

      if (data === '\u001b' || data === '\u0003') {
        this.cancel()
      }

      return
    }

    if (this.phase === 'running' && data === '\u0003') {
      this.lines = this.lines.slice(0, this.activeIndex + 1)
      this.send(data)
      this.emit()
      return
    }

    this.send(data)
  }

  observeOutput = (data: string): void => {
    if (this.phase !== 'running' || data.length === 0) {
      return
    }

    this.output = `${this.output}${data}`.slice(-12000)

    if (data.includes('\n')) {
      this.sawNewline = true
    }

    this.armIdle()
  }

  begin = (): void => {
    if (this.phase !== 'preview' || this.lines.length === 0) {
      return
    }

    this.clearPreview()
    this.phase = 'running'
    this.activeIndex = 0
    this.dispatchCurrent()
  }

  cancel = (): void => {
    this.clearIdle()
    this.clearPreview()
    this.phase = 'idle'
    this.lines = []
    this.activeIndex = 0
    this.output = ''
    this.sawNewline = false
    this.emit()
  }

  dropPending = (): void => {
    if (this.phase !== 'running') {
      this.cancel()
      return
    }

    this.lines = this.lines.slice(0, this.activeIndex + 1)
    this.emit()
  }

  dispose(): void {
    this.clearIdle()
  }

  private dispatchCurrent(): void {
    this.output = ''
    this.sawNewline = false
    this.clearIdle()

    const line = this.lines[this.activeIndex]

    if (line === undefined) {
      this.finish()
      return
    }

    this.send(`\u0015${line}\r`)
    this.emit()
  }

  private onIdle = (): void => {
    this.idleCancel = null

    if (this.phase !== 'running' || !this.sawNewline) {
      return
    }

    const visible = lastVisibleLine(this.output)
    const current = this.lines[this.activeIndex] ?? ''

    if (current.length > 0 && visible.endsWith(current)) {
      return
    }

    if (!isShellPrompt(visible)) {
      return
    }

    this.activeIndex += 1

    if (this.activeIndex >= this.lines.length) {
      this.finish()
      return
    }

    this.dispatchCurrent()
  }

  private finish(): void {
    this.clearIdle()
    this.clearPreview()
    this.phase = 'idle'
    this.lines = []
    this.activeIndex = 0
    this.output = ''
    this.sawNewline = false
    this.emit()
  }

  private renderPreview(): void {
    if (this.lines.length > 40) {
      return
    }

    const body = this.lines.map(visibleCommand).join('\r\n')
    this.writeLocal(`\u001b7\r\n\u001b[90m${body}\u001b[0m\u001b8`)
    this.previewDrawn = true
  }

  private clearPreview(): void {
    if (!this.previewDrawn) {
      return
    }

    this.writeLocal('\u001b[0J')
    this.previewDrawn = false
  }

  private armIdle(): void {
    this.clearIdle()
    this.idleCancel = this.schedule(this.onIdle, this.idleMs)
  }

  private clearIdle(): void {
    this.idleCancel?.()
    this.idleCancel = null
  }

  private emit(): void {
    this.onChange?.(this.getSnapshot())
  }
}

export { IDLE_SNAPSHOT }
