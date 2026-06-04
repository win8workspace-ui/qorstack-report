'use client'

import Icon from '@/components/icon'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { DemoShell } from './demo-shell'

type Phase = 'empty' | 'dropping' | 'filled' | 'submitting'

const PHASES: { key: Phase; duration: number }[] = [
  { key: 'empty', duration: 1400 },
  { key: 'dropping', duration: 1000 },
  { key: 'filled', duration: 2400 },
  { key: 'submitting', duration: 1400 }
]

/** Mirrors /pdf/templates/create centered card layout inside the dashboard shell. */
export const DemoStepUpload = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = useState<Phase>('empty')

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const cycle = (idx: number) => {
      if (cancelled) return
      const { key, duration } = PHASES[idx]
      setPhase(key)
      timer = setTimeout(() => {
        if (idx + 1 < PHASES.length) cycle(idx + 1)
        else onComplete?.()
      }, duration)
    }
    cycle(0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [onComplete])

  const filled = phase === 'filled' || phase === 'submitting'

  return (
    <DemoShell active='templates' projectName='test'>
      <div className='flex h-full justify-center overflow-y-auto px-4 py-3'>
        <div className='flex w-full max-w-[440px] flex-col gap-2'>
          {/* Toolbar panel */}
          <div className='flex items-center gap-2 rounded-md bg-content1 px-3 py-2 ring-hairline dark:bg-content2'>
            <button className='flex h-6 w-6 items-center justify-center rounded text-default-500'>
              <Icon icon='lucide:arrow-left' className='h-3 w-3' />
            </button>
            <div className='flex h-6 w-6 items-center justify-center rounded bg-content2 dark:bg-content3'>
              <Icon icon='lucide:file-plus' className='h-3 w-3 text-primary' />
            </div>
            <div className='min-w-0 flex-1'>
              <h1 className='font-headline text-[12px] font-bold text-foreground leading-tight'>New Template</h1>
              <p className='text-[9px] text-default-500 leading-tight'>
                Upload a DOCX or XLSX file and prepare it for generation.
              </p>
            </div>
          </div>

          {/* Body panel */}
          <div className='space-y-2.5 rounded-md bg-content1 p-3 ring-hairline dark:bg-content2'>
            {/* Template name */}
            <div>
              <span className='font-label text-[8.5px] font-bold uppercase tracking-wider text-default-500'>
                Template Name <span className='text-danger'>*</span>
              </span>
              <div className='mt-1 rounded bg-content2 px-2 py-1.5 dark:bg-content3'>
                <span className={`font-mono text-[10px] ${filled ? 'text-foreground' : 'text-default-400'}`}>
                  {filled ? 'Digital Signed Visa_v2' : 'e.g. Monthly Invoice'}
                </span>
              </div>
            </div>

            {/* File drop zone */}
            <div>
              <span className='font-label text-[8.5px] font-bold uppercase tracking-wider text-default-500'>
                File <span className='text-danger'>*</span>
              </span>
              <div
                className={`mt-1 flex min-h-[110px] flex-col items-center justify-center rounded-md border border-dashed p-3 transition-colors ${
                  phase === 'dropping'
                    ? 'border-primary bg-primary/10'
                    : 'border-default-300 bg-content2 dark:border-default-200/20 dark:bg-content3'
                }`}>
                <AnimatePresence mode='wait'>
                  {phase === 'empty' && (
                    <motion.div
                      key='empty'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className='flex flex-col items-center text-center'>
                      <div className='mb-1.5 flex h-10 w-10 items-center justify-center rounded-md bg-content3 dark:bg-content2'>
                        <Icon icon='lucide:upload-cloud' className='h-5 w-5 text-default-400' />
                      </div>
                      <p className='text-[11.5px] font-bold text-foreground'>Click to upload or drag and drop</p>
                      <p className='mt-0.5 text-[9px] font-medium text-default-500'>
                        DOCX - Word template / XLSX - Excel template
                      </p>
                    </motion.div>
                  )}

                  {phase === 'dropping' && (
                    <motion.div
                      key='drop'
                      initial={{ opacity: 0, y: -28, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className='flex flex-col items-center text-center'>
                      <div className='mb-1.5 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground'>
                        <Icon icon='lucide:file-text' className='h-5 w-5' />
                      </div>
                      <p className='text-[11.5px] font-bold text-primary'>Digital Signed Visa_v2.docx</p>
                      <p className='mt-0.5 text-[9px] text-default-500'>Release to upload</p>
                    </motion.div>
                  )}

                  {filled && (
                    <motion.div
                      key='filled'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='flex flex-col items-center text-center'>
                      <div className='mb-1.5 flex h-10 w-10 items-center justify-center rounded-md bg-content1 ring-hairline dark:bg-content2'>
                        <Icon icon='lucide:file-check' className='h-5 w-5 text-foreground' />
                      </div>
                      <p className='text-[11.5px] font-bold text-foreground'>Digital Signed Visa_v2.docx</p>
                      <p className='mt-0.5 text-[9px] font-medium text-default-500'>Word Template / 68.8 KB</p>
                      <button className='mt-1 inline-flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wide text-default-400'>
                        <Icon icon='lucide:x' className='h-2.5 w-2.5' />
                        Remove File
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Auto-detect strip */}
            <div className='flex items-center gap-1.5 rounded bg-content2 px-2 py-1.5 dark:bg-content3'>
              <Icon icon='lucide:scan-search' className='h-3.5 w-3.5 shrink-0 text-primary' />
              <div className='min-w-0'>
                <p className='text-[10px] font-medium text-foreground leading-tight'>Auto-detect variables</p>
                <p className='text-[8.5px] leading-snug text-default-500'>
                  Variables like <code className='font-mono text-primary'>{'{{name}}'}</code> will be detected from the file automatically.
                </p>
              </div>
            </div>

            {/* Custom template key (collapsed) */}
            <div className='rounded bg-content2 p-2 dark:bg-content3'>
              <p className='text-[10px] font-semibold text-foreground'>
                Custom template key <span className='font-normal text-default-400'>(optional)</span>
              </p>
              <div className='mt-1 flex gap-1'>
                <div className='flex-1 rounded bg-content1 px-1.5 py-1 dark:bg-content2'>
                  <span className='font-mono text-[9px] text-default-400'>e.g. invoice-monthly</span>
                </div>
                <button className='flex h-6 w-6 shrink-0 items-center justify-center rounded bg-content1 text-default-500 dark:bg-content2'>
                  <Icon icon='lucide:sparkles' className='h-3 w-3' />
                </button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className='flex items-center justify-end gap-1.5'>
            <button className='rounded bg-content2 px-2.5 py-1.5 font-label text-[9.5px] font-bold uppercase tracking-wider text-default-500 dark:bg-content3'>
              Cancel
            </button>
            <button
              className={`inline-flex items-center gap-1 rounded px-3 py-1.5 font-label text-[9.5px] font-bold uppercase tracking-wider transition-colors ${
                filled ? 'bg-foreground text-background' : 'bg-content3 text-default-400'
              }`}>
              {phase === 'submitting' ? (
                <>
                  <Icon icon='lucide:loader-2' className='h-2.5 w-2.5 animate-spin' />
                  Creating
                </>
              ) : (
                <>
                  <Icon icon='lucide:plus' className='h-2.5 w-2.5' />
                  Create Template
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DemoShell>
  )
}
