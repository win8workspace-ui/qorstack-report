'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  cn
} from '@heroui/react'
import Icon from '@/components/icon'
import type { TemplateVersionResponse } from '@/api/generated/main-service/apiGenerated'
import { EditTemplateDetailsPopover } from './EditTemplateDetailsPopover'
import { BrandChip } from '@/components/ui/BrandChip'

export type TemplateType = 'pdf' | 'excel'

type EditState = {
  isOpen: boolean
  name: string
  templateKey: string
  isGeneratingKey: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onNameChange: (v: string) => void
  onKeyChange: (v: string) => void
  onGenerateKey: () => void
  onSave: () => void
}

type Props = {
  templateType: TemplateType
  templateName: string
  templateKey: string
  activeVersion: number | null
  versions: TemplateVersionResponse[]
  isDownloadingSource: boolean
  edit: EditState
  onDelete: () => void
  onDownloadSource: () => void
  onVersionChange: (v: number) => void
  onUpdateFile: () => void
}

const TYPE_BADGE: Record<TemplateType, { className: string; icon: string; label: string }> = {
  pdf: {
    className:
      'bg-danger-50 text-danger-700 dark:bg-danger-100/20 dark:text-danger-500',
    icon: 'lucide:file-text',
    label: 'PDF'
  },
  excel: {
    className:
      'bg-success-50 text-success-700 dark:bg-success-100/20 dark:text-success-500',
    icon: 'lucide:file-spreadsheet',
    label: 'Excel'
  }
}

/**
 * Injects the template builder's header content into the global app header
 * via two portal slots: `#global-header-left` and `#global-header-actions`.
 *
 * Left slot: breadcrumb, template name, type badge, key chip, rename popover.
 * Right slot: delete, download source, version dropdown, update template.
 */
export const TemplateHeaderPortals: React.FC<Props> = ({
  templateType,
  templateName,
  templateKey,
  activeVersion,
  versions,
  isDownloadingSource,
  edit,
  onDelete,
  onDownloadSource,
  onVersionChange,
  onUpdateFile
}) => {
  const [leftEl, setLeftEl] = useState<Element | null>(null)
  const [actionsEl, setActionsEl] = useState<Element | null>(null)

  useEffect(() => {
    setLeftEl(document.getElementById('global-header-left'))
    setActionsEl(document.getElementById('global-header-actions'))
  }, [])

  const badge = TYPE_BADGE[templateType]

  return (
    <>
      {leftEl &&
        createPortal(
          <div className='ml-4 flex flex-col'>
            <div className='mb-0.5 flex items-center gap-1 text-[11px] font-medium text-default-500'>
              <span className='cursor-default transition-colors hover:text-default-700'>Templates</span>
              <Icon icon='lucide:chevron-right' className='h-3 w-3 text-default-400' />
              <span className='text-default-600'>Builder</span>
            </div>
            <div className='flex items-center gap-3'>
              <h1 className='text-lg font-black tracking-tight text-foreground lg:text-xl'>
                {templateName || 'Untitled'}
              </h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider',
                  badge.className
                )}>
                <Icon icon={badge.icon} className='h-3 w-3' />
                {badge.label}
              </span>
              <div className='flex items-center gap-1.5 rounded-md bg-content2/60 px-2 py-1 text-default-500'>
                <span className='font-mono text-[9.5px] font-semibold tracking-wide'>{templateKey}</span>
                <button
                  className='transition-colors hover:text-foreground'
                  title='Copy Key'
                  onClick={() => navigator.clipboard.writeText(templateKey)}>
                  <Icon icon='lucide:copy' className='h-3 w-3' />
                </button>
              </div>
              <EditTemplateDetailsPopover
                isOpen={edit.isOpen}
                onOpenChange={edit.onOpenChange}
                name={edit.name}
                templateKey={edit.templateKey}
                onNameChange={edit.onNameChange}
                onKeyChange={edit.onKeyChange}
                onGenerateKey={edit.onGenerateKey}
                onSave={edit.onSave}
                isGeneratingKey={edit.isGeneratingKey}
                isSaving={edit.isSaving}
              />
            </div>
          </div>,
          leftEl
        )}

      {actionsEl &&
        createPortal(
          <div className='flex items-center gap-2 sm:gap-3'>
            <Button
              isIconOnly
              color='danger'
              variant='flat'
              size='sm'
              className='bg-danger-50 text-danger-500 hover:bg-danger-100'
              onPress={onDelete}
              title='Delete Template'>
              <Icon icon='lucide:trash-2' className='h-4 w-4' />
            </Button>

            <Button
              isIconOnly
              variant='flat'
              size='sm'
              className='bg-content3 text-default-500 hover:bg-default-200'
              isLoading={isDownloadingSource}
              title='Download Source File'
              onPress={onDownloadSource}>
              {!isDownloadingSource && <Icon icon='lucide:download' className='h-4 w-4' />}
            </Button>

            <div className='mx-1 h-6 w-px bg-default-200' />

            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant='bordered'
                  size='sm'
                  className='hidden border-default-200 font-medium text-default-600 sm:flex'
                  endContent={<Icon icon='lucide:chevron-down' className='h-3 w-3 text-default-400' />}>
                  v{activeVersion || '?'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label='Template Versions'
                selectionMode='single'
                selectedKeys={activeVersion ? [activeVersion.toString()] : []}
                className='max-h-[300px] overflow-y-auto'
                onAction={key => onVersionChange(Number(key))}>
                {versions.length > 0 ? (
                  versions.map(v => (
                    <DropdownItem key={v.version?.toString() || ''}>
                      <div className='flex items-center gap-2'>
                        <p>version {v.version}</p>
                        {v.version === activeVersion && (
                          <BrandChip tone='primary' size='sm' mono className='hidden sm:inline-flex'>
                            Active
                          </BrandChip>
                        )}
                      </div>
                    </DropdownItem>
                  ))
                ) : (
                  <DropdownItem key='current'>Version {activeVersion}</DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>

            <Button
              variant='flat'
              size='sm'
              className='hidden bg-content3 font-medium text-default-600 hover:bg-default-200 sm:flex'
              startContent={<Icon icon='lucide:upload-cloud' className='h-4 w-4' />}
              onPress={onUpdateFile}>
              Update Template
            </Button>
          </div>,
          actionsEl
        )}
    </>
  )
}
