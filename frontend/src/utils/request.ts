/**
 * Detect axios/fetch cancellation across error shapes.
 * Live preview & background fetches throw on unmount; we ignore those.
 */
export const isRequestCanceled = (err: unknown): boolean => {
  const error = err as { code?: string; name?: string; message?: string }
  return (
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    /canceled|aborted/i.test(error?.message || '')
  )
}
