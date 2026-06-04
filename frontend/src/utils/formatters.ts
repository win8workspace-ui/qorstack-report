export const formatDuration = (ms: number | null | undefined): string => {
  if (ms == null) return '-'
  if (ms === 0) return '0s'
  if (ms < 100) return `${Math.round(ms)}ms`            // 1-99 ms  → "50ms"
  const seconds = ms / 1000
  if (seconds < 10) return `${seconds.toFixed(1)}s`     // 0.1-9.9s → "0.5s"
  return `${Math.round(seconds)}s`                       // 10+ s    → "15s"
}

export const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
