function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '')

  if (normalized.length === 3) {
    const [r, g, b] = normalized.split('').map((ch) => Number.parseInt(ch + ch, 16))
    return { r, g, b }
  }

  if (normalized.length === 6) {
    const value = Number.parseInt(normalized, 16)
    if (Number.isNaN(value)) {
      return null
    }

    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    }
  }

  return null
}

function channelToHex(channel: number): string {
  return Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, '0')
}

export function toHexColor({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`
}

export function mixHexColors(left: string, right: string, ratio: number): string {
  const a = parseHexColor(left)
  const b = parseHexColor(right)

  if (!a || !b) {
    return left
  }

  const t = Math.max(0, Math.min(1, ratio))

  return toHexColor({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  })
}

export function relativeLuminance(hex: string): number {
  const rgb = parseHexColor(hex)

  if (!rgb) {
    return 0
  }

  const normalize = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  const r = normalize(rgb.r)
  const g = normalize(rgb.g)
  const b = normalize(rgb.b)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function foregroundOn(background: string): string {
  return relativeLuminance(background) > 0.58 ? '#101114' : '#f8fafc'
}

export function isLightSurface(surface: string): boolean {
  return relativeLuminance(surface) > 0.55
}