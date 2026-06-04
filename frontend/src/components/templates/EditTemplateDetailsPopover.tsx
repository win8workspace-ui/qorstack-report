'use client'

import React from 'react'
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '@heroui/react'
import Icon from '@/components/icon'

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  name: string
  templateKey: string
  onNameChange: (v: string) => void
  onKeyChange: (v: string) => void
  onGenerateKey: () => void
  onSave: () => void
  isGeneratingKey: boolean
  isSaving: boolean
}

/**
 * Edit Template Details popover — rename and regenerate template key.
 * Triggered by a pencil icon next to the template title.
 */
export const EditTemplateDetailsPopover: React.FC<Props> = ({
  isOpen,
  onOpenChange,
  name,
  templateKey,
  onNameChange,
  onKeyChange,
  onGenerateKey,
  onSave,
  isGeneratingKey,
  isSaving
}) => (
  <Popover isOpen={isOpen} onOpenChange={onOpenChange} placement='bottom-start' showArrow offset={10}>
    <PopoverTrigger>
      <Button
        isIconOnly
        size='sm'
        variant='light'
        radius='md'
        className='text-default-400 hover:bg-content3 hover:text-default-600'>
        <Icon icon='lucide:pencil' className='h-3.5 w-3.5' />
      </Button>
    </PopoverTrigger>
    <PopoverContent className='w-80 p-4'>
      <div className='w-full space-y-4'>
        <h4 className='font-medium text-foreground'>Edit Template Details</h4>
        <Input label='Template Name' variant='bordered' value={name} onValueChange={onNameChange} />
        <Input
          label='Template Key'
          variant='bordered'
          placeholder='Optional'
          value={templateKey}
          onValueChange={onKeyChange}
          endContent={
            <Button
              isIconOnly
              size='sm'
              variant='flat'
              className='bg-content3 text-default-600 hover:bg-default-200'
              onPress={onGenerateKey}
              isLoading={isGeneratingKey}
              title='Generate Key'>
              {!isGeneratingKey && <Icon icon='lucide:sparkles' className='h-4 w-4' />}
            </Button>
          }
        />
        <div className='flex justify-end gap-2'>
          <Button size='sm' variant='light' onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size='sm' color='primary' onPress={onSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
)
