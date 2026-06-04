import React from 'react'
import Icon from '@/components/icon'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

interface CopyButtonProps {
  text: string
  variant?: 'light' | 'dark'
}

/**
 * Labelled "Copy" / "Copied!" button — for code blocks and docs.
 * For an icon-only inline variant, see `components/common/CopyButton.tsx`.
 */
export const CopyButton = ({ text, variant = 'light' }: CopyButtonProps) => {
  const { copied, copy } = useCopyToClipboard({
    onError: err => console.error('Failed to copy text:', err)
  })
  const isDark = variant === 'dark'

  return (
    <button
      onClick={() => void copy(text)}
      className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
        isDark
          ? 'text-default-400 hover:bg-default-700/50 hover:text-white'
          : 'text-default-400 hover:bg-content3 hover:text-foreground'
      }`}
      title='Copy to clipboard'>
      {copied ? (
        <>
          <Icon icon='solar:check-circle-bold' className='text-success' />
          <span className='text-success'>Copied!</span>
        </>
      ) : (
        <>
          <Icon icon='solar:copy-outline' />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}
