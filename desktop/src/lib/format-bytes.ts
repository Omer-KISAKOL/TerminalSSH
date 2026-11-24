export function formatBytes(value: number | null | undefined, locale: 'tr' | 'en'): string {
  if (value == null || !Number.isFinite(value)) {
    return '—'
  }

  const units = locale === 'tr' ? ['B', 'KB', 'MB', 'GB', 'TB'] : ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const digits = unitIndex === 0 ? 0 : size >= 100 ? 0 : size >= 10 ? 1 : 2
  const formatted = new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(size)

  return `${formatted} ${units[unitIndex]}`
}