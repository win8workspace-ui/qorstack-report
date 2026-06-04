'use client'

import Icon from '@/components/icon'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useCallback } from 'react'

const CODE_SNIPPET = `{
  "templateKey": "invoice-template",
  "replace": {
    "customer_name": "Acme Co., Ltd.",
    "invoice_no": "INV-2026-001"
  },
  "table": [
    {
      "rows": [
        { "item": "Service A", "qty": 2, "total": 2400 }
      ],
      "repeatHeader": true
    }
  ],
  "image": { "logo": { "src": "https://example.com/logo.png", "fit": "contain" } },
  "qrcode": { "payment": { "text": "https://pay.example/inv-001" } }
}`

const FEATURES = [
  { icon: 'lucide:scan-line', label: 'Detect variables, tables, images and codes' },
  { icon: 'lucide:sliders-horizontal', label: 'Configure render payload visually' },
  { icon: 'lucide:code-2', label: 'Copy SDK and REST examples' }
]

const VisualDesignSection = () => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CODE_SNIPPET)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error: any) {
      // silently fail
    }
  }, [])

  return (
    <section className='bg-content1 py-20 sm:py-24'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
          {/* Text (Left) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className='relative'>
            <div className='mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20'>
              <Icon icon='lucide:layout-dashboard' className='h-4 w-4' /> Template Manager
            </div>
            <h2 className='mb-6 font-headline text-3xl font-bold leading-tight md:text-4xl'>
              <span className='text-foreground'>Manage templates visually,</span> <br />
              <span className='text-primary'>map variables automatically.</span>
            </h2>
            <p className='mb-8 text-base leading-relaxed text-default-600 sm:text-lg'>
              Upload your DOCX or XLSX template and Qorstack Report detects the fields your API payload needs. Fill
              values visually, test the output, then copy SDK or REST examples that match the same payload.
            </p>
            <ul className='space-y-3'>
              {FEATURES.map(item => (
                <li
                  key={item.label}
                  className='flex items-center gap-3 rounded-lg bg-content2/40 p-3 ring-1 ring-inset ring-default-200/60 dark:bg-content2/60 dark:ring-default-300/10'>
                  <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20'>
                    <Icon icon={item.icon} className='h-4 w-4' />
                  </span>
                  <span className='text-sm font-medium text-default-700 sm:text-base'>{item.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Graphic (Right) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='relative w-full'>
            <div className='relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-default-300/30 dark:ring-default-200/10'>
              {/* Light variant */}
              <Image
                src='/images/marketing/template-builder-light.svg'
                alt='Template Manager UI showing auto variable mapping'
                width={800}
                height={600}
                className='block h-auto w-full dark:hidden'
              />
              {/* Dark variant */}
              <Image
                src='/images/marketing/template-builder-dark.svg'
                alt=''
                aria-hidden
                width={800}
                height={600}
                className='hidden h-auto w-full dark:block'
              />
            </div>

            {/* Code snippet with copy */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className='absolute -bottom-4 -right-2 w-[180px] overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-default-200/60 dark:bg-content2 dark:ring-default-300/20 sm:-bottom-6 sm:-right-4 sm:w-[220px]'>
              <div className='flex items-center justify-between border-b border-default-200 px-2.5 py-1.5 dark:border-default-300/20'>
                <div className='flex items-center gap-1.5'>
                  <Icon icon='lucide:braces' className='h-2.5 w-2.5 text-success' />
                  <span className='font-label text-[8px] font-bold text-default-500'>Payload Example</span>
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-label text-[8px] font-bold transition-colors hover:bg-content2 dark:hover:bg-content3 ${copied ? 'text-success' : 'text-default-500'}`}>
                  <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} className='h-2 w-2' />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className='px-2.5 py-2'>
                <pre className='font-mono text-[9px] leading-[1.5] text-default-700'>
                  {'{\n'}
                  {'  '}
                  <span className='text-secondary'>{'"templateKey"'}</span>
                  <span className='text-default-500'>{': '}</span>
                  <span className='text-success'>{'"invoice-template"'}</span>
                  {',\n'}
                  {'  '}
                  <span className='text-secondary'>{'"replace"'}</span>
                  <span className='text-default-500'>{': {'}</span>
                  {'\n'}
                  {'    '}
                  <span className='text-secondary'>{'"customer_name"'}</span>
                  <span className='text-default-500'>{': '}</span>
                  <span className='text-success'>{'"Acme Co., Ltd."'}</span>
                  {',\n'}
                  {'    '}
                  <span className='text-secondary'>{'"invoice_no"'}</span>
                  <span className='text-default-500'>{': '}</span>
                  <span className='text-success'>{'"INV-2026-001"'}</span>
                  {'\n'}
                  {'  '}
                  <span className='text-default-500'>{'}'}</span>
                  {',\n'}
                  {'  '}
                  <span className='text-secondary'>{'"table"'}</span>
                  <span className='text-default-500'>{': '}</span>
                  <span className='text-warning'>{'[...]'}</span>
                  {',\n'}
                  {'  '}
                  <span className='text-secondary'>{'"image"'}</span>
                  <span className='text-default-500'>{': { '}</span>
                  <span className='text-success'>{'...'}</span>
                  <span className='text-default-500'>{' }'}</span>
                  {'\n}'}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default VisualDesignSection
