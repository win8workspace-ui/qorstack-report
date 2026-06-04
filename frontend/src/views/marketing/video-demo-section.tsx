'use client'

import Icon from '@/components/icon'
import { motion } from 'framer-motion'
import { useState, useCallback, useRef, useLayoutEffect } from 'react'
import { DemoStepCreate } from './demo-step-create'
import { DemoStepUpload } from './demo-step-upload'
import { DemoStepBuild } from './demo-step-build'
import { DemoStepApi } from './demo-step-api'

const demos = [
  {
    id: 'create',
    number: '01',
    title: 'Create Project',
    desc: 'Set up your workspace and generate API keys in seconds.',
    icon: 'lucide:folder-plus',
    Component: DemoStepCreate
  },
  {
    id: 'upload',
    number: '02',
    title: 'Upload Template',
    desc: 'Upload DOCX or XLSX templates and detect variables, tables, images, QR codes, and barcodes.',
    icon: 'lucide:upload',
    Component: DemoStepUpload
  },
  {
    id: 'build',
    number: '03',
    title: 'Build & Test',
    desc: 'Fill sample data, configure file settings, and preview the rendered result.',
    icon: 'lucide:play-circle',
    Component: DemoStepBuild
  },
  {
    id: 'api',
    number: '04',
    title: 'Call API',
    desc: 'Send JSON and receive PDF, DOCX, Excel, or ZIP output from your self-hosted API.',
    icon: 'lucide:terminal',
    Component: DemoStepApi
  }
]

const easeExpoOut = [0.16, 1, 0.3, 1] as const

const DESIGN_WIDTH = 1024
const DESIGN_HEIGHT = 576

const VideoDemoSection = () => {
  const [activeDemo, setActiveDemo] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) setScale(Math.min(1, w / DESIGN_WIDTH))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const handleDemoSwitch = useCallback((index: number) => {
    setActiveDemo(index)
  }, [])

  const handleStepComplete = useCallback(() => {
    setActiveDemo(prev => (prev + 1) % demos.length)
  }, [])

  const ActiveComponent = demos[activeDemo].Component

  return (
    <section id='demo' className='scroll-mt-20 py-24'>
      <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeExpoOut }}
          className='mb-12 text-center'>
          <span className='mb-4 inline-block rounded bg-primary-100 px-3 py-1.5 font-label text-[11px] font-bold uppercase tracking-[0.05em] text-primary dark:bg-content3'>
            See it in action
          </span>
          <h2
            className='mb-4 font-headline font-bold leading-tight tracking-tight text-foreground'
            style={{ fontSize: 'clamp(1.75rem, 1.25rem + 2vw, 2.5rem)' }}>
            From template to production output
          </h2>
          <p className='mx-auto max-w-xl text-base leading-relaxed text-default-600'>
            Watch the four-step workflow that turns Word or Excel templates and JSON data into PDF, DOCX, Excel, or ZIP output.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: easeExpoOut }}
          className='mx-auto max-w-5xl'>
          {/* Step buttons — compact pills on mobile, full cards on desktop */}
          <div className='mb-4 grid grid-cols-4 gap-1.5 sm:gap-3'>
            {demos.map((demo, i) => {
              const isActive = activeDemo === i
              const isComplete = i < activeDemo
              return (
                <button
                  key={demo.id}
                  onClick={() => handleDemoSwitch(i)}
                  className={`group relative overflow-hidden rounded-md text-left transition-all duration-200 sm:rounded-lg sm:px-4 sm:py-3.5 ${
                    isActive
                      ? 'bg-content2 dark:bg-content3'
                      : 'bg-content1 hover:bg-content2 dark:bg-content2 dark:hover:bg-content3'
                  }`}>
                  {/* Active indicator bar (desktop only — mobile uses bottom underline) */}
                  {isActive && <div className='absolute left-0 top-0 hidden h-full w-[3px] bg-primary sm:block' />}

                  {/* MOBILE: compact pill — icon + label only */}
                  <div className='flex items-center gap-1.5 px-2 py-1.5 sm:hidden'>
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isComplete
                            ? 'bg-success/15 text-success'
                            : 'text-default-500'
                      }`}>
                      <Icon icon={isComplete ? 'lucide:check' : demo.icon} className='h-2.5 w-2.5' />
                    </div>
                    <span className={`truncate text-[10px] font-semibold leading-tight ${isActive ? 'text-foreground' : 'text-default-500'}`}>
                      {demo.title.split(' ')[0]}
                    </span>
                  </div>

                  {/* DESKTOP: full card */}
                  <div className='hidden sm:block'>
                    <div className='mb-2 flex items-center gap-2'>
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : isComplete
                              ? 'bg-success/15 text-success'
                              : 'bg-content4 text-default-600'
                        }`}>
                        <Icon icon={isComplete ? 'lucide:check' : demo.icon} className='h-3.5 w-3.5' />
                      </div>
                      <span className={`font-label text-xl font-bold tabular-nums ${isActive ? 'text-primary' : 'text-default-400'}`}>
                        {demo.number}
                      </span>
                    </div>
                    <h4 className={`text-sm font-semibold leading-tight ${isActive ? 'text-foreground' : 'text-default-600'}`}>
                      {demo.title}
                    </h4>
                    <p className='mt-1 text-xs leading-snug text-default-500'>{demo.desc}</p>
                  </div>

                  {/* Active underline */}
                  {isActive && (
                    <div className='absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden'>
                      <div className='h-full w-full animate-pulse bg-primary' />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Demo viewport */}
          <div className='overflow-hidden rounded-xl bg-content1 dark:bg-content2'>
            {/* Browser chrome */}
            <div className='flex items-center bg-default-100 px-4 py-2.5 dark:bg-content3'>
              <div className='flex space-x-1.5'>
                <div className='h-2.5 w-2.5 rounded-full bg-default-400' />
                <div className='h-2.5 w-2.5 rounded-full bg-default-400' />
                <div className='h-2.5 w-2.5 rounded-full bg-default-400' />
              </div>
              <div className='mx-auto font-label text-[11px] font-medium tracking-[0.02em] text-default-600'>
                qorstack.dev — {demos[activeDemo].title}
              </div>
              <div className='w-10' />
            </div>

            {/* Animated step content — fixed canvas scaled to fit (mobile = scaled PC) */}
            <div
              ref={viewportRef}
              className='relative w-full overflow-hidden bg-default-100 dark:bg-content1'
              style={{ aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}` }}>
              <div
                className='absolute left-0 top-0 origin-top-left'
                style={{
                  width: `${DESIGN_WIDTH}px`,
                  height: `${DESIGN_HEIGHT}px`,
                  transform: `scale(${scale})`
                }}>
                <ActiveComponent key={demos[activeDemo].id} onComplete={handleStepComplete} />
              </div>
              <span className='absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded bg-content1/85 px-2 py-1 font-label text-[10px] font-bold uppercase tracking-wider text-foreground backdrop-blur-sm ring-hairline dark:bg-content2/85'>
                <Icon icon='lucide:play' className='h-3 w-3 text-primary' />
                Auto-playing
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default VideoDemoSection
