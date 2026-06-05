import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { obsidianDark } from './code-themes'
import { CopyButton } from './CopyButton'

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  /** Hide the chrome bar entirely — useful when embedding inside custom terminal UIs */
  showHeader?: boolean
  /** Remove default my-4 margin */
  compact?: boolean
  /** Hide line numbers (default: true — matches CodeSwitcher) */
  showLineNumbers?: boolean
  className?: string
  /** Cap the scroll area height (e.g. 480 or '60vh'). When set, content scrolls vertically. */
  maxHeight?: number | string
  /** When set, renders a download button in the header next to copy. */
  downloadHref?: string
  /** Optional filename for the download attribute. */
  downloadFilename?: string
  /** Wrap long lines instead of scrolling horizontally (good for prose / prompts). */
  wrap?: boolean
}

const BG = '#050505'
const CHROME = '#0b0b0b'
const MUTED = '#7C8090'
const LINE_NUM = 'rgb(113, 113, 122)'

export const CodeBlock = ({
  code,
  language = 'text',
  title,
  showHeader = true,
  compact = false,
  showLineNumbers = true,
  className = '',
  maxHeight,
  downloadHref,
  downloadFilename,
  wrap = false
}: CodeBlockProps) => {
  return (
    <div
      className={`overflow-hidden rounded-xl ${compact ? '' : 'my-4'} ${className}`}
      style={{ background: BG }}>
      {showHeader && (
        <div
          className='flex items-center justify-between border-b px-3 py-1.5'
          style={{ background: CHROME, borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className='font-mono text-xs' style={{ color: MUTED }}>
            {title || language}
          </span>
          <div className='flex items-center gap-2'>
            {downloadHref && (
              <a
                href={downloadHref}
                download={downloadFilename}
                title={downloadFilename ? `Download ${downloadFilename}` : 'Download'}
                className='group inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 font-label text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:scale-[1.03] hover:shadow-md hover:shadow-primary/30'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-3 w-3 transition-transform group-hover:translate-y-0.5'>
                  <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                  <polyline points='7 10 12 15 17 10' />
                  <line x1='12' y1='15' x2='12' y2='3' />
                </svg>
                Download
              </a>
            )}
            <CopyButton text={code} variant='dark' />
          </div>
        </div>
      )}
      <div className='relative'>
        {!showHeader && (
          <div className='pointer-events-none absolute right-1.5 top-1.5 z-10'>
            <div className='pointer-events-auto rounded-md bg-white/5 backdrop-blur-sm ring-1 ring-inset ring-white/10'>
              <CopyButton text={code} variant='dark' />
            </div>
          </div>
        )}
        <div
        className={`no-scrollbar ${wrap ? '' : 'overflow-x-auto'} ${maxHeight === undefined ? '' : 'overflow-y-auto'}`}
        style={maxHeight === undefined ? undefined : { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}>
        <SyntaxHighlighter
          language={language}
          style={obsidianDark}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '12.5px',
            lineHeight: 1.55,
            background: 'transparent',
            padding: '12px',
            minWidth: '100%',
            width: wrap ? '100%' : 'max-content',
            ...(wrap ? { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } : {})
          }}
          showLineNumbers={showLineNumbers}
          lineNumberStyle={{
            minWidth: '2.25em',
            paddingRight: '1em',
            textAlign: 'right',
            userSelect: 'none',
            color: LINE_NUM
          }}
          wrapLongLines={wrap}>
          {code}
        </SyntaxHighlighter>
        </div>
      </div>
    </div>
  )
}
