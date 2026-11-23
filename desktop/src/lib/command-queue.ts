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
  /** true ise girdi kuyruğa alınmadan doğrudan gönderilir (ör. nano/vim gibi tam ekran uygulamalar). */
  shouldBypass?: () => boolean
}

const IDLE_SNAPSHOT: CommandQueueSnapshot = {
  phase: 'idle',
  lines: [],
  activeIndex: 0,
}

export function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, '')
}

type HeredocMarker = { delimiter: string; stripTabs: boolean }

type QuoteState = 'none' | 'single' | 'double'

/**
 * Bir komut satırını tarar: açık kalan tırnak durumunu ve satırda açılan heredoc
 * işaretlerini (<<EOF, <<-'EOF', <<"EOF") döndürür.
 */
function scanCommandLine(
  line: string,
  initialQuote: QuoteState,
): { quote: QuoteState; heredocs: HeredocMarker[] } {
  const heredocs: HeredocMarker[] = []
  let quote = initialQuote

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (quote === 'single') {
      if (char === "'") {
        quote = 'none'
      }
      continue
    }

    if (char === '\\') {
      index += 1
      continue
    }

    if (quote === 'double') {
      if (char === '"') {
        quote = 'none'
      }
      continue
    }

    if (char === "'") {
      quote = 'single'
      continue
    }

    if (char === '"') {
      quote = 'double'
      continue
    }

    if (char === '#' && (index === 0 || /\s/u.test(line[index - 1] ?? ''))) {
      break
    }

    if (char === '<' && line[index + 1] === '<' && line[index + 2] !== '<') {
      const match = /^<<(-?)\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][\w.-]*))/u.exec(line.slice(index))

      if (match) {
        heredocs.push({
          delimiter: match[2] ?? match[3] ?? match[4] ?? '',
          stripTabs: match[1] === '-',
        })
        index += match[0].length - 1
        continue
      }

      index += 1
    }
  }

  return { quote, heredocs }
}

/**
 * Yapıştırılan metni çalıştırılacak komut birimlerine böler. Heredoc (EOF) gövdesi,
 * satır sonu ters bölü ile devam eden ve tırnağı kapanmayan komutlar tek birim kalır;
 * birim içindeki satırlar satır sonu karakteriyle birleştirilir.
 */
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

  const units: string[] = []
  let current: string[] = []
  let quote: QuoteState = 'none'
  let pending: HeredocMarker[] = []

  for (const rawLine of rawLines) {
    if (pending.length > 0) {
      current.push(rawLine)
      const marker = pending[0]
      const candidate = marker.stripTabs ? rawLine.replace(/^\t+/u, '') : rawLine

      if (candidate === marker.delimiter) {
        pending = pending.slice(1)
      }

      if (pending.length === 0 && quote === 'none') {
        units.push(current.join('\n'))
        current = []
      }
      continue
    }

    const line = quote === 'none' ? rawLine.replace(/\s+$/u, '') : rawLine

    if (current.length === 0 && line.trim().length === 0) {
      continue
    }

    current.push(line)

    const scanned = scanCommandLine(line, quote)
    quote = scanned.quote
    pending = scanned.heredocs

    const continued = quote !== 'none' || /(?:^|[^\\])(?:\\\\)*\\$/u.test(line)

    if (pending.length === 0 && !continued) {
      units.push(current.join('\n'))
      current = []
    }
  }

  if (current.length > 0) {
    units.push(current.join('\n'))
  }

  if (units.length === 0 || (units.length === 1 && !units[0].includes('\n'))) {
    return null
  }

  return units
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

export class CommandQueue {
  private phase: CommandQueuePhase = 'idle'
  private lines: string[] = []
  private previewRaw = ''
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
  private readonly shouldBypass: () => boolean

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
    this.shouldBypass = options.shouldBypass ?? (() => false)
  }

  getSnapshot(): CommandQueueSnapshot {
    return {
      phase: this.phase,
      lines: [...this.lines],
      activeIndex: this.activeIndex,
    }
  }

  handleInput = (data: string, options?: CommandQueueInputOptions): void => {
    if (this.phase === 'idle' && !options?.autoStart && this.shouldBypass()) {
      this.send(data)
      return
    }

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

      if (options?.autoStart === false) {
        this.send(data)
        return
      }

      if (options?.autoStart === true) {
        this.phase = 'running'
        this.emit()
        this.dispatchCurrent()
        return
      }

      this.previewRaw = data
      this.phase = 'preview'
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

  getEditorText = (): string => {
    if (this.previewRaw.trim().length > 0) {
      return this.previewRaw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    }

    return this.lines.join('\n')
  }

  applyEditorText = (text: string): boolean => {
    if (this.phase !== 'preview') {
      return false
    }

    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const parsed = splitPastedCommands(normalized.endsWith('\n') ? normalized : `${normalized}\n`)

    if (!parsed || parsed.length === 0) {
      this.cancel()
      return false
    }

    this.previewRaw = normalized
    this.lines = parsed
    this.emit()
    return true
  }

  begin = (): void => {
    if (this.phase !== 'preview' || this.lines.length === 0) {
      return
    }

    if (this.previewRaw.trim()) {
      const parsed = splitPastedCommands(
        this.previewRaw.endsWith('\n') ? this.previewRaw : `${this.previewRaw}\n`,
      )
      if (parsed) {
        this.lines = parsed
      }
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
    this.previewRaw = ''
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

    this.send(`\u0015${line.split('\n').join('\r')}\r`)
    this.emit()
  }

  private onIdle = (): void => {
    this.idleCancel = null

    if (this.phase !== 'running' || !this.sawNewline) {
      return
    }

    const visible = lastVisibleLine(this.output)
    const current = (this.lines[this.activeIndex] ?? '').split('\n').pop() ?? ''

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
    this.previewRaw = ''
    this.activeIndex = 0
    this.output = ''
    this.sawNewline = false
    this.emit()
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
