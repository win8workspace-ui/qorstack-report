'use client'

import { useEffect, useRef, useState } from 'react'
import { isRequestCanceled } from '@/utils/request'

export type LiveRenderResult = {
  downloadUrl?: string | null
  pdfPreviewUrl?: string | null
  sheetPageMap?: Record<string, number> | null
  sheetPdfUrlMap?: Record<string, string> | null
} | null | undefined

type Options<TUiState> = {
  templateKey: string
  uiState: TUiState
  enabled: boolean
  isLoading: boolean
  /**
   * Run the live render. Receives the latest uiState and an AbortSignal —
   * caller must wire the signal through to the API client.
   */
  render: (uiState: TUiState, signal: AbortSignal) => Promise<LiveRenderResult>
  /** Called when the render succeeds with the full result. */
  onRender: (result: LiveRenderResult & { downloadUrl: string }) => void
  /** Debounce delay before issuing the render call. Default 800ms. */
  debounceMs?: number
}

type Result = {
  isRendering: boolean
  error: string | null
}

/**
 * Debounced, abortable, race-condition-free live preview.
 *
 * Behavior:
 * - Triggers a render on every uiState change after a debounce window.
 * - Aborts in-flight requests when state changes or the hook tears down.
 * - Drops stale responses (only the most recent request wins).
 * - Resets when `enabled` flips to false.
 *
 * The caller owns the rendered URL — `onRender` is called when a fresh
 * URL is available so the page can update its own state and preview mode.
 */
export const useLivePreview = <TUiState>({
  templateKey,
  uiState,
  enabled,
  isLoading,
  render,
  onRender,
  debounceMs = 800
}: Options<TUiState>): Result => {
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)
  // Latest callbacks captured in refs so the effect doesn't re-fire on each render.
  const renderRef = useRef(render)
  const onRenderRef = useRef(onRender)

  useEffect(() => {
    renderRef.current = render
    onRenderRef.current = onRender
  }, [render, onRender])

  useEffect(() => {
    if (!enabled || isLoading || !templateKey) {
      requestIdRef.current += 1
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      abortRef.current?.abort()
      abortRef.current = null
      setIsRendering(false)
      setError(null)
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (timerRef.current) clearTimeout(timerRef.current)
    abortRef.current?.abort()
    abortRef.current = null

    setIsRendering(true)
    setError(null)

    const timer = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await renderRef.current(uiState, controller.signal)
        if (controller.signal.aborted || requestId !== requestIdRef.current) return
        if (res?.downloadUrl) onRenderRef.current(res as LiveRenderResult & { downloadUrl: string })
      } catch (err) {
        if (controller.signal.aborted || requestId !== requestIdRef.current || isRequestCanceled(err)) return
        setError('Live preview failed. Check the builder values and try again.')
      } finally {
        if (requestId === requestIdRef.current && abortRef.current === controller) {
          abortRef.current = null
          setIsRendering(false)
        }
      }
    }, debounceMs)

    timerRef.current = timer

    return () => {
      if (timerRef.current === timer) {
        clearTimeout(timer)
        timerRef.current = null
      }
      abortRef.current?.abort()
    }
  }, [uiState, enabled, isLoading, templateKey, debounceMs])

  return { isRendering, error }
}
