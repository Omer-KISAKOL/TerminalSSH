export function extractOpsSection(raw: string, name: string): string {
  const marker = `===${name}===`
  const start = raw.indexOf(marker)

  if (start < 0) {
    return ''
  }

  let from = start + marker.length
  if (raw[from] === '\r') {
    from += 1
  }
  if (raw[from] === '\n') {
    from += 1
  }

  const next = raw.indexOf('\n===', from)
  return (next < 0 ? raw.slice(from) : raw.slice(from, next)).trim()
}