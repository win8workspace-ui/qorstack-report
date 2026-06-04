'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const MIN_WIDTH = 280
const MAX_WIDTH = 900

export const useResizablePanel = (storageKey: string, defaultWidth: number) => {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return defaultWidth
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) return parsed
    }
    return defaultWidth
  })

  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const delta = e.clientX - startX.current
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta))
    setWidth(newWidth)
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    setWidth(prev => {
      localStorage.setItem(storageKey, String(prev))
      return prev
    })
  }, [storageKey])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDragging.current = true
      startX.current = e.clientX
      startWidth.current = width
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [width]
  )

  return { width, handleMouseDown }
}
