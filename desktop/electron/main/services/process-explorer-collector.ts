import type { ProcessExplorerSnapshot } from '@shared/server-ops/process-parser'
import { parseProcessExplorerOutput, processExplorerHasPayload } from '@shared/server-ops/process-parser'

const PROCESS_SHELL = `
echo '===PROCESSES==='
ps -eo pid=,ppid=,pcpu=,pmem=,rss=,comm= --sort=-pcpu 2>/dev/null | head -n 80
`.trim()

export function buildProcessExplorerCommand(): string {
  return `/bin/sh -c ${JSON.stringify(PROCESS_SHELL)}`
}

export { parseProcessExplorerOutput, processExplorerHasPayload }

export type { ProcessExplorerSnapshot }