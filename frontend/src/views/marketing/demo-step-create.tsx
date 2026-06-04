'use client'

import Icon from '@/components/icon'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

type Phase = 'form' | 'typing' | 'submitting' | 'created'

const PROJECT_NAME = 'Invoice Service'
const API_KEY = 'qr_live_8fd5bf13ebe2442cb7bb4f7bc36140df'

const PHASES: { key: Phase; duration: number }[] = [
  { key: 'form', duration: 1000 },
  { key: 'typing', duration: 1800 },
  { key: 'submitting', duration: 1100 },
  { key: 'created', duration: 3600 }
]

/** Mirrors the real /(onboarding)/create-project two-pane layout with top header. */
export const DemoStepCreate = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = useState<Phase>('form')
  const [typed, setTyped] = useState('')

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let typeTimer: ReturnType<typeof setTimeout>

    const cycle = (idx: number) => {
      if (cancelled) return
      const { key, duration } = PHASES[idx]
      setPhase(key)

      if (key === 'typing') {
        setTyped('')
        let i = 0
        const tick = () => {
          if (cancelled) return
          i += 1
          setTyped(PROJECT_NAME.slice(0, i))
          if (i < PROJECT_NAME.length) typeTimer = setTimeout(tick, 75)
        }
        typeTimer = setTimeout(tick, 200)
      } else if (key === 'submitting' || key === 'created') {
        setTyped(PROJECT_NAME)
      } else {
        setTyped('')
      }

      timer = setTimeout(() => {
        if (idx + 1 < PHASES.length) cycle(idx + 1)
        else onComplete?.()
      }, duration)
    }
    cycle(0)
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(typeTimer)
    }
  }, [onComplete])

  const showCreated = phase === 'created'

  return (
    <div className='absolute inset-0 flex flex-col bg-background dark:bg-content1'>
      {/* Top header */}
      <header className='flex h-10 items-center justify-between border-b border-default-200/70 px-4 dark:border-default-200/10'>
        <div className='flex items-center gap-1.5'>
          <div className='flex h-5 w-5 items-center justify-center rounded bg-foreground text-background'>
            <span className='font-headline text-[10px] font-bold'>Q</span>
          </div>
          <span className='font-headline text-[11px] font-bold tracking-tight'>Qorstack Report</span>
        </div>
        <Icon icon='lucide:moon' className='h-3.5 w-3.5 text-default-400' />
      </header>

      {/* Two-pane content */}
      <div className='grid flex-1 grid-cols-[1fr_300px]'>
        {/* Left: form pane */}
        <div className='flex flex-col items-center justify-center px-8'>
          <div className='w-full max-w-[300px]'>
            {/* Step indicator at top */}
            <div className='mb-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em]'>
              <span className={showCreated ? 'text-default-400' : 'text-primary'}>01 — Create</span>
              <span className={`h-px flex-1 ${showCreated ? 'bg-primary/50' : 'bg-default-200 dark:bg-default-200/20'}`} />
              <span className={showCreated ? 'text-primary' : 'text-default-400'}>02 — API Key</span>
            </div>

            <AnimatePresence mode='wait'>
              {showCreated ? (
                <motion.div
                  key='live'
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                  <p className='font-mono text-[10px] font-bold text-success'>✓ project.created</p>
                  <h1 className='mt-2 font-headline text-[20px] font-bold leading-tight tracking-tight text-foreground'>
                    Project is live.
                  </h1>
                  <p className='mt-1.5 text-[11px] leading-snug text-default-500'>
                    Copy the API key below before continuing.
                  </p>

                  <div className='mt-4'>
                    <div className='flex items-center justify-between'>
                      <span className='font-label text-[8.5px] font-bold uppercase tracking-wider text-default-400'>
                        API Key
                      </span>
                      <span className='inline-flex items-center gap-1 text-[9px] font-semibold text-default-500'>
                        <Icon icon='lucide:copy' className='h-2.5 w-2.5' />
                        Copy
                      </span>
                    </div>
                    <div className='mt-1 overflow-hidden rounded bg-default-100 px-2.5 py-2 dark:bg-default-100/30'>
                      <p className='break-all font-mono text-[10px] leading-relaxed text-default-600 dark:text-default-300'>
                        {API_KEY}
                      </p>
                    </div>
                  </div>

                  <p className='mt-3 text-[10px] leading-snug text-default-400'>
                    <span className='font-semibold text-amber-600 dark:text-amber-400'>Not retrievable after this page.</span>
                    {' '}Store it in a password manager.
                  </p>

                  <button
                    disabled
                    className='mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded bg-foreground px-3 py-2 font-label text-[10px] font-bold uppercase tracking-wider text-background'>
                    Open Dashboard
                    <Icon icon='lucide:arrow-right' className='h-3 w-3' />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key='form'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}>
                  <p className='font-label text-[8.5px] font-bold uppercase tracking-[0.15em] text-default-400'>
                    New project
                  </p>
                  <h1 className='mt-2 font-headline text-[22px] font-bold leading-tight tracking-tight text-foreground'>
                    Name your project.
                  </h1>
                  <p className='mt-1.5 text-[11px] leading-snug text-default-500'>
                    Groups your templates, API keys, and generation history.
                  </p>

                  <div className='mt-4 rounded bg-default-100 px-2.5 py-2 dark:bg-default-100/30'>
                    <span className='block font-label text-[8.5px] font-bold uppercase tracking-wider text-default-500'>
                      Project name
                    </span>
                    <div className='mt-0.5 flex items-center'>
                      <span className={`font-mono text-[11px] ${typed ? 'text-foreground' : 'text-default-400'}`}>
                        {typed || 'e.g. Invoice Service'}
                      </span>
                      {phase === 'typing' && <span className='ml-0.5 inline-block h-3 w-px animate-pulse bg-foreground' />}
                    </div>
                  </div>

                  <button
                    disabled
                    className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded px-3 py-2 font-label text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      typed ? 'bg-foreground text-background' : 'bg-default-200 text-default-500 dark:bg-content3'
                    }`}>
                    {phase === 'submitting' ? (
                      <>
                        <Icon icon='lucide:loader-2' className='h-3 w-3 animate-spin' />
                        Creating…
                      </>
                    ) : (
                      <>
                        Continue
                        <Icon icon='lucide:arrow-right' className='h-3 w-3' />
                      </>
                    )}
                  </button>

                  <button className='mt-1 w-full py-1.5 text-[10px] text-default-400'>Cancel</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: dark info panel */}
        <div className='flex flex-col bg-code-panel p-5'>
          <AnimatePresence mode='wait'>
            {showCreated ? (
              <motion.div
                key='terminal'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <span className='font-label text-[8.5px] font-bold uppercase tracking-[0.15em] text-code-subtle'>
                  Quick Start
                </span>
                <h2 className='mt-1.5 font-headline text-[14px] font-bold leading-tight text-code-high'>
                  Make your first API call
                </h2>
                <div className='mt-3 overflow-hidden rounded bg-code-body'>
                  <div className='flex items-center gap-1.5 bg-code-chrome px-2.5 py-1.5'>
                    <div className='flex gap-1'>
                      <span className='h-1.5 w-1.5 rounded-full bg-danger/50' />
                      <span className='h-1.5 w-1.5 rounded-full bg-warning/50' />
                      <span className='h-1.5 w-1.5 rounded-full bg-success/50' />
                    </div>
                    <span className='font-mono text-[9px] text-code-subtle'>Terminal</span>
                  </div>
                  <pre className='m-0 px-2.5 py-2 font-mono text-[8.5px] leading-relaxed text-code-base'>
{String.raw`$ curl -X POST {BASE_URL}/render/word/template \
   -H "X-API-Key: qr_live_8fd5bf13ebe2442..." \
   -H "Content-Type: application/json" \
   -d '{"templateKey":"tpl_xxx",...}'`}
                  </pre>
                </div>
                <div className='mt-3 flex items-start gap-1.5 rounded bg-code-chrome px-2 py-1.5'>
                  <Icon icon='lucide:lightbulb' className='mt-0.5 h-3 w-3 shrink-0 text-code-accent' />
                  <span className='text-[9px] leading-snug text-code-base'>
                    Replace <span className='rounded bg-code-chip px-1 font-mono text-code-high'>tpl_xxx</span> with your template key.
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key='steps'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <span className='font-label text-[8.5px] font-bold uppercase tracking-[0.15em] text-code-subtle'>
                  How it works
                </span>
                <h2 className='mt-1.5 font-headline text-[14px] font-bold leading-tight text-code-high'>
                  From data to PDF in seconds.
                </h2>
                <p className='mt-1.5 text-[10px] leading-snug text-code-base'>
                  Qorstack Report turns JSON data and your templates into pixel-perfect PDFs via a simple REST API.
                </p>
                <ul className='mt-3 space-y-2'>
                  {[
                    { i: 'lucide:key', t: 'Create a project and get your API key' },
                    { i: 'lucide:file-text', t: 'Upload or design a PDF template' },
                    { i: 'lucide:send', t: 'POST JSON data to the render endpoint' },
                    { i: 'lucide:file-check', t: 'Receive a generated PDF instantly' }
                  ].map(row => (
                    <li key={row.t} className='flex items-center gap-2'>
                      <div className='flex h-5 w-5 shrink-0 items-center justify-center rounded bg-code-chip'>
                        <Icon icon={row.i} className='h-2.5 w-2.5 text-code-accent' />
                      </div>
                      <span className='text-[10px] leading-snug text-code-base'>{row.t}</span>
                    </li>
                  ))}
                </ul>
                <div className='mt-4 flex items-center gap-1.5 border-t border-code-chip pt-3'>
                  <Icon icon='lucide:zap' className='h-2.5 w-2.5 text-code-accent' />
                  <span className='text-[9.5px] text-code-subtle'>Free during Beta · Unlimited generations</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
