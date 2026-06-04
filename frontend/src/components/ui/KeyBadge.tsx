'use client'

import Icon from '@/components/icon'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

interface KeyBadgeProps {
  value: string
  label?: string
  className?: string
}

export const KeyBadge = ({ value, label = 'KEY', className }: KeyBadgeProps) => {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div
      className={`ring-hairline flex max-w-[160px] items-center gap-1 rounded-md bg-content2 px-1.5 py-0.5 sm:max-w-none ${className ?? ''}`}>
      <span className='shrink-0 font-mono text-[9.5px] font-medium text-default-600'>{label}:</span>
      <span className='truncate font-mono text-[9.5px] font-bold text-foreground'>{value}</span>
      <button
        onClick={e => {
          e.stopPropagation()
          void copy(value)
        }}
        title='Copy'
        className='ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-default-500 hover:bg-content3 hover:text-foreground'>
        <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} className='h-2.5 w-2.5' />
      </button>
    </div>
  )
}
