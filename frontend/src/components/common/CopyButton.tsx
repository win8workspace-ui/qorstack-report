import React from 'react'
import { Tooltip } from '@heroui/react'
import Icon from '@/components/icon'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

/**
 * Icon-only copy button with a "Copied!" tooltip — for inline use next to keys/IDs.
 * For a labelled variant (used inside code blocks), see `components/docs/CopyButton.tsx`.
 */
export const CopyButton = ({ text, className = '' }: { text: string; className?: string }) => {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className={className}>
      <Tooltip
        isOpen={copied}
        content='Copied!'
        placement='top'
        showArrow
        classNames={{
          base: 'before:bg-black after:bg-black',
          content: 'bg-black text-white font-bold text-[10px] px-2 py-1'
        }}>
        <button
          onClick={e => {
            e.stopPropagation()
            void copy(text)
          }}
          className='flex h-6 w-6 items-center justify-center rounded text-default-400 transition-colors hover:text-primary active:scale-95'>
          <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} className='h-3 w-3' />
        </button>
      </Tooltip>
    </div>
  )
}
