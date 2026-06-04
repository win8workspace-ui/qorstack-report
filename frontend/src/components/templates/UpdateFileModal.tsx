'use client'

import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, cn } from '@heroui/react'
import Icon from '@/components/icon'
import { useFileUpload } from '@/hooks/use-file-upload'

type TemplateType = 'pdf' | 'excel'

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  templateType: TemplateType
  isSaving: boolean
  onSubmit: (file: File) => void | Promise<void>
}

const CONFIG: Record<
  TemplateType,
  {
    accept: string[]
    acceptAttr: string
    hint: string
    invalidMessage: string
    fileIcon: string
    fileIconBg: string
  }
> = {
  pdf: {
    accept: ['.docx'],
    acceptAttr: '.docx',
    hint: 'DOCX files only',
    invalidMessage: 'Please upload a .docx file only',
    fileIcon: 'lucide:file-check',
    fileIconBg: 'border-primary bg-primary text-primary-foreground'
  },
  excel: {
    accept: ['.xlsx', '.xls'],
    acceptAttr: '.xlsx,.xls',
    hint: 'XLSX files only',
    invalidMessage: 'Please upload an .xlsx or .xls file',
    fileIcon: 'lucide:file-spreadsheet',
    fileIconBg: 'border-success bg-success text-white'
  }
}

/**
 * Shared "Update Template" modal — replaces the source .docx/.xlsx file
 * of an existing template. Auto-detects variables from the new file on save.
 */
export const UpdateFileModal: React.FC<Props> = ({ isOpen, onOpenChange, templateType, isSaving, onSubmit }) => {
  const cfg = CONFIG[templateType]
  const {
    uploadedFile,
    isDragOver,
    inputRef,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    clearFile,
    openPicker
  } = useFileUpload({ accept: cfg.accept, invalidMessage: cfg.invalidMessage })

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='2xl'>
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader>Update Template File</ModalHeader>
            <ModalBody>
              <div
                className={cn(
                  'relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center border-2 border-dashed p-6 transition-all duration-200',
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : uploadedFile
                      ? 'border-primary/50 bg-content2'
                      : 'border-default-300 bg-content2 hover:border-primary hover:bg-primary/5',
                  isSaving && 'pointer-events-none opacity-50'
                )}
                onDrop={!isSaving ? handleDrop : undefined}
                onDragOver={!isSaving ? handleDragOver : undefined}
                onDragLeave={!isSaving ? handleDragLeave : undefined}
                onClick={() => !isSaving && openPicker()}>
                <input
                  ref={inputRef}
                  type='file'
                  className='hidden'
                  accept={cfg.acceptAttr}
                  onChange={handleFileChange}
                />

                {uploadedFile ? (
                  <div className='flex flex-col items-center text-center'>
                    <div
                      className={cn(
                        'mb-3 flex h-12 w-12 shrink-0 items-center justify-center border shadow-sm',
                        cfg.fileIconBg
                      )}>
                      <Icon icon={cfg.fileIcon} className='h-6 w-6' />
                    </div>
                    <p className='text-base font-bold text-foreground'>{uploadedFile.name}</p>
                    <p className='text-xs font-medium text-default-500'>{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        clearFile()
                      }}
                      disabled={isSaving}
                      className='mt-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-default-400 hover:text-danger disabled:pointer-events-none disabled:opacity-50'>
                      <Icon icon='lucide:x' className='h-3.5 w-3.5' />
                      Remove File
                    </button>
                  </div>
                ) : (
                  <>
                    <div className='mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-content2'>
                      <Icon icon='lucide:upload-cloud' className='h-8 w-8 text-default-400' />
                    </div>
                    <div className='text-center'>
                      <p className='text-lg font-bold text-foreground'>Click to upload or drag and drop</p>
                      <p className='mt-1 text-xs font-medium text-default-500'>{cfg.hint}</p>
                    </div>
                  </>
                )}
              </div>
              <div className='rounded-md bg-primary/5 px-3 py-2.5'>
                <div className='flex items-center gap-2'>
                  <Icon icon='lucide:scan-search' className='h-6 w-6 shrink-0 text-primary' />
                  <div>
                    <p className='text-sm font-medium text-foreground'>Auto-detect variables</p>
                    <p className='text-xs text-default-500'>
                      Variables like <code className='font-mono'>{`{{name}}`}</code> will be detected from the file and
                      added to the builder automatically.
                    </p>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant='light' onPress={onClose} isDisabled={isSaving}>
                Cancel
              </Button>
              <Button
                color='primary'
                isDisabled={!uploadedFile}
                isLoading={isSaving}
                onPress={() => uploadedFile && onSubmit(uploadedFile)}>
                Update Template
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
