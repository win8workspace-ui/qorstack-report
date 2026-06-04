'use client'

import Icon from '@/components/icon'
import { CodeSwitcher, useSharedLanguage } from '@/components/docs/CodeSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback, useMemo } from 'react'
import { getSdkCodeExamples } from '@/utils/code-gen'

const SHOWCASE_DATA_BASIC = {
  templateKey: 'invoice-template',
  fileName: 'invoice-2026-001',
  replace: {
    customer_name: 'Acme Co., Ltd.',
    invoice_no: 'INV-2026-001',
    total: '2400'
  },
  table: [
    {
      rows: [
        { item: 'Design', qty: 2, total: 2400 },
        { item: 'Implementation', qty: 1, total: 5200 }
      ],
      repeatHeader: true
    }
  ]
}

const SHOWCASE_DATA_ADVANCED = {
  ...SHOWCASE_DATA_BASIC,
  qrcode: {
    payment: {
      text: 'https://pay.example/inv-2026-001',
      size: 160
    }
  },
  barcode: {
    tracking: {
      text: 'INV-2026-001',
      format: 'Code128',
      width: 220,
      height: 80,
      includeText: true
    }
  },
  pdfPassword: {
    userPassword: 'viewer-pass',
    restrictPrinting: true
  },
  watermark: {
    text: 'CONFIDENTIAL',
    opacity: 0.14,
    rotation: -45
  }
}

type ShowcaseMode = 'basic' | 'advanced'

const ActionShowcaseSection = () => {
  const [activeLang, setActiveLang] = useSharedLanguage('nodejs')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [mode, setMode] = useState<ShowcaseMode>('basic')
  const showcaseExamples = useMemo(
    () => getSdkCodeExamples(mode === 'basic' ? SHOWCASE_DATA_BASIC : SHOWCASE_DATA_ADVANCED, { documentType: 'pdf' }),
    [mode]
  )

  const simulateGeneration = useCallback(() => {
    if (isGenerating) return
    setIsGenerating(true)
    setIsGenerated(false)
    setTimeout(() => {
      setIsGenerating(false)
      setIsGenerated(true)
    }, 2000)
  }, [isGenerating])

  return (
    <section className='relative overflow-hidden bg-background py-24'>
      <div className='relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='mb-16 max-w-2xl'>
          <span className='font-label mb-3 block text-[11px] font-bold uppercase tracking-widest text-primary'>
            Developer Experience
          </span>
          <h2 className='font-headline mb-4 text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-tight text-foreground'>
            Current SDK examples, copy-ready.
          </h2>
          <p className='text-base leading-relaxed text-default-600'>
            Install the{' '}
            <code className='font-label rounded bg-content3 px-1.5 py-0.5 text-sm text-primary'>
              qorstack-report-sdk
            </code>,
            send the same payload your template builder uses: variables, tables, QR codes, barcodes, password
            protection, and watermark settings.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className='mx-auto max-w-7xl'>
          <div className='flex flex-col items-stretch gap-8 md:flex-row'>
            {/* Left: CodeSwitcher */}
            <div className='w-full md:w-1/2'>
              <div className='mb-3 inline-flex items-center gap-1 rounded-lg bg-content2 p-1 ring-hairline'>
                {(['basic', 'advanced'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-md px-3 py-1 font-label text-[10.5px] font-bold uppercase tracking-wider transition-colors ${
                      mode === m
                        ? 'bg-content1 text-foreground shadow-sm'
                        : 'text-default-500 hover:text-foreground'
                    }`}>
                    {m}
                  </button>
                ))}
                <span className='ml-1.5 hidden text-[10px] text-default-400 sm:inline'>
                  {mode === 'basic'
                    ? 'templateKey + replace + table'
                    : '+ QR · barcode · password · watermark'}
                </span>
              </div>
              <CodeSwitcher
                examples={showcaseExamples}
                activeLang={activeLang}
                onLangChange={setActiveLang}
                isDisableMarginY
                maxHeight={520}
              />
            </div>

            {/* Right: Document Result */}
            <div className='flex w-full flex-col md:w-1/2'>
              <div className='relative flex flex-1 flex-col overflow-hidden rounded-xl bg-content1 ring-hairline dark:bg-content2'>
                {/* Loading Overlay */}
                <AnimatePresence>
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className='absolute inset-0 z-20 flex flex-col items-center justify-center bg-content1/90 backdrop-blur-sm'>
                      <Icon icon='lucide:loader-2' className='mb-4 h-10 w-10 animate-spin text-primary' />
                      <p className='font-label text-sm font-bold uppercase tracking-wide text-default-600'>
                        Generating...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Letterhead */}
                <div className='flex items-center justify-between bg-foreground px-6 py-3 text-background'>
                  <span className='font-headline text-sm font-bold tracking-wide'>QORSTACK CORP.</span>
                  <div className='flex items-center gap-2'>
                    {mode === 'advanced' && (
                      <span className='inline-flex items-center gap-1 rounded bg-warning/20 px-1.5 py-0.5 font-label text-[9px] font-bold uppercase tracking-wider text-warning ring-1 ring-warning/30'>
                        <Icon icon='lucide:lock' className='h-2.5 w-2.5' />
                        Password
                      </span>
                    )}
                    <span className='font-label text-[10px] font-bold uppercase tracking-[0.2em] opacity-70'>Invoice</span>
                  </div>
                </div>

                {/* Body */}
                <div className='relative flex flex-1 flex-col px-6 py-5'>
                  {/* Watermark overlay (advanced mode) */}
                  {mode === 'advanced' && (
                    <span
                      aria-hidden
                      className='pointer-events-none absolute inset-0 flex items-center justify-center font-headline text-[44px] font-bold uppercase tracking-[8px] text-foreground/[0.06]'
                      style={{ transform: 'rotate(-22deg)' }}>
                      CONFIDENTIAL
                    </span>
                  )}
                  {/* Meta rows */}
                  <div className='mb-5 grid grid-cols-2 gap-x-4 gap-y-3'>
                    <div>
                      <div className='font-label text-[9px] font-bold uppercase tracking-widest text-default-400'>Bill To</div>
                      <div
                        className={`mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-colors duration-300 ${
                          isGenerated ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
                        }`}>
                        {isGenerated ? 'Acme Co., Ltd.' : '{{customer_name}}'}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-label text-[9px] font-bold uppercase tracking-widest text-default-400'>Invoice No.</div>
                      <div
                        className={`mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-colors duration-300 ${
                          isGenerated ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
                        }`}>
                        {isGenerated ? 'INV-2026-001' : '{{invoice_no}}'}
                      </div>
                    </div>
                    <div>
                      <div className='font-label text-[9px] font-bold uppercase tracking-widest text-default-400'>Email</div>
                      <div className='mt-1 font-mono text-[11px] text-default-600'>contact@acme.example</div>
                    </div>
                    <div className='text-right'>
                      <div className='font-label text-[9px] font-bold uppercase tracking-widest text-default-400'>Issue Date</div>
                      <div className='mt-1 font-mono text-[11px] text-default-600'>15 Mar 2026</div>
                    </div>
                  </div>

                  {/* Table header */}
                  <div className='grid grid-cols-[1fr_auto_auto] items-center gap-x-4 bg-foreground px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-background'>
                    <span>Description</span>
                    <span className='w-10 text-right'>Qty</span>
                    <span className='w-20 text-right'>Amount</span>
                  </div>

                  {/* Rows */}
                  <div>
                    {[
                      { item: 'Design system audit', qty: 2, total: 2400 },
                      { item: 'Implementation sprint', qty: 1, total: 5200 }
                    ].map(row => (
                      <div
                        key={row.item}
                        className='grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-default-200/60 px-3 py-2 text-xs text-default-700 dark:border-default-200/20 dark:text-default-400'>
                        <span
                          className={`truncate rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-300 ${
                            isGenerated ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
                          }`}>
                          {isGenerated ? row.item : '{{row:item}}'}
                        </span>
                        <span className='w-10 text-right tabular-nums'>{isGenerated ? row.qty : '—'}</span>
                        <span className='w-20 text-right font-mono tabular-nums text-foreground'>
                          {isGenerated ? row.total.toLocaleString() : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal / VAT */}
                  <div className='mt-3 space-y-1 px-3 text-xs text-default-500'>
                    <div className='flex justify-between'>
                      <span>Subtotal</span>
                      <span className='font-mono tabular-nums text-foreground'>{isGenerated ? '7,600' : '—'}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>VAT 7%</span>
                      <span className='font-mono tabular-nums text-foreground'>{isGenerated ? '532' : '—'}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className='mt-3 flex items-center justify-between bg-foreground px-3 py-2.5 text-background'>
                    <span className='font-label text-[10px] font-bold uppercase tracking-widest opacity-70'>Total THB</span>
                    <span className='font-mono text-base font-bold tabular-nums'>
                      {isGenerated ? '8,132' : '—'}
                    </span>
                  </div>

                  {/* QR + Barcode strip (advanced only) */}
                  {mode === 'advanced' && (
                    <div className='mt-3 grid grid-cols-[auto_1fr] items-center gap-3 rounded-md bg-content2 p-2.5 ring-hairline dark:bg-content3'>
                      {/* Mini QR */}
                      <div className='grid h-12 w-12 grid-cols-6 grid-rows-6 gap-px overflow-hidden rounded-sm bg-background p-1 ring-1 ring-foreground/30'>
                        {[
                          1, 1, 1, 0, 1, 1,
                          1, 0, 1, 1, 0, 1,
                          1, 1, 0, 1, 1, 0,
                          0, 1, 1, 0, 1, 1,
                          1, 0, 1, 1, 0, 1,
                          1, 1, 0, 1, 1, 1
                        ].map((on, i) => (
                          <span key={`qr-${i}-${on}`} className={on ? 'bg-foreground' : 'bg-background'} />
                        ))}
                      </div>
                      {/* Barcode + label */}
                      <div className='min-w-0'>
                        <div className='font-label text-[8.5px] font-bold uppercase tracking-widest text-default-400'>
                          QR · Barcode
                        </div>
                        <div className='mt-1 flex h-6 items-end gap-[1.5px]'>
                          {[3,5,2,4,6,3,5,2,4,3,6,5,2,4,3,5,2,6,4,3,5,2,4,6,3,5,4,2,3,5,6,4,2,3,5,2,6,4,3].map((w, i) => (
                            <span
                              key={`bar-${i}-${w}`}
                              className='block bg-foreground'
                              style={{ width: `${w / 2}px`, height: '100%' }}
                            />
                          ))}
                        </div>
                        <div className='mt-1 font-mono text-[9px] tabular-nums text-default-500'>INV-2026-001</div>
                      </div>
                    </div>
                  )}

                  {/* Footer note */}
                  <div className='mt-auto pt-4 text-center text-[9.5px] text-default-400'>
                    {mode === 'advanced' && isGenerated ? (
                      <>Generated · password-protected · watermark applied · 0.82s</>
                    ) : (
                      <>Generated by Qorstack Report · {isGenerated ? '0.82s' : 'ready to render'}</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Generate Button */}
          <div className='mt-8 flex justify-center'>
            <button
              onClick={simulateGeneration}
              disabled={isGenerating}
              className='flex items-center gap-3 rounded-md bg-primary px-10 py-3.5 font-sans text-base font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50'>
              {isGenerating ? (
                <>
                  <Icon icon='lucide:loader-2' className='h-5 w-5 animate-spin' /> Generating...
                </>
              ) : (
                <>
                  <Icon icon='lucide:zap' className='h-5 w-5' /> Run Generate
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default ActionShowcaseSection
