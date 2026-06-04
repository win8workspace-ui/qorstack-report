'use client'

import { useCallback, useRef, useState } from 'react'
import { addToast } from '@heroui/react'

type Options = {
  /** Allowed extensions including dot, e.g. `['.docx']` or `['.xlsx', '.xls']` */
  accept: string[]
  invalidMessage?: string
}

/**
 * Shared file picker + drag-drop state machine.
 * Used by Update File modals across PDF and Excel template pages.
 */
export const useFileUpload = ({ accept, invalidMessage }: Options) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndSet = useCallback(
    (file: File) => {
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
      if (!accept.includes(ext)) {
        addToast({
          title: 'Invalid file type',
          description: invalidMessage || `Please upload a ${accept.join(' or ')} file`,
          color: 'danger'
        })
        return
      }
      setUploadedFile(file)
    },
    [accept, invalidMessage]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) validateAndSet(e.target.files[0])
    },
    [validateAndSet]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files?.[0]) validateAndSet(e.dataTransfer.files[0])
    },
    [validateAndSet]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const clearFile = useCallback(() => {
    setUploadedFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const openPicker = useCallback(() => inputRef.current?.click(), [])

  return {
    uploadedFile,
    isDragOver,
    inputRef,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    clearFile,
    openPicker
  }
}
