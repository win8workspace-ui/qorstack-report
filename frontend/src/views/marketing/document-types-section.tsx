'use client'

import Icon from '@/components/icon'
import { motion } from 'framer-motion'
import Image from 'next/image'

const documentTypes = [
  {
    title: 'Invoice PDF',
    desc: 'Variables, repeating table rows, QR payment, and protected PDF output.',
    icon: 'lucide:receipt',
    image: '/images/example-template-render/current-invoice.svg'
  },
  {
    title: 'Excel Report',
    desc: 'Auto-filter, frozen headers, totals, number formats, and sheet splitting.',
    icon: 'lucide:file-spreadsheet',
    image: '/images/example-template-render/current-excel.svg'
  },
  {
    title: 'Protected Contract',
    desc: 'PDF password permissions, watermark text, and ZIP packaging.',
    icon: 'lucide:file-lock-2',
    image: '/images/example-template-render/current-contract.svg'
  },
  {
    title: 'Shipping Label',
    desc: 'Barcode generation with format, size, color, and readable text.',
    icon: 'lucide:tag',
    image: '/images/example-template-render/current-label.svg'
  },
  {
    title: 'Ticket QR',
    desc: 'QR codes from URLs, payloads, colors, backgrounds, and embedded logos.',
    icon: 'lucide:qr-code',
    image: '/images/example-template-render/current-ticket.svg'
  }
]

const DocumentTypesSection = () => {
  return (
    <section className='bg-content1 py-24'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='mb-14 max-w-2xl'>
          <span className='font-label mb-3 block text-[11px] font-bold uppercase tracking-widest text-primary'>
            Current API Coverage
          </span>
          <h2 className='font-headline mb-4 text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-tight text-foreground'>
            One render API, practical document workflows.
          </h2>
          <p className='text-base leading-relaxed text-default-600'>
            Each example maps to fields supported by the current API: variables, tables, images, QR codes, barcodes,
            Excel options, PDF password protection, watermarks, and ZIP output.
          </p>
        </motion.div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5'>
          {documentTypes.map((doc, i) => (
            <motion.div
              key={doc.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className='group overflow-hidden rounded-lg bg-background ring-1 ring-default-300/20 dark:bg-content2'>
              <div className='relative aspect-[3/4] overflow-hidden bg-background sm:aspect-[4/5] dark:bg-content1'>
                <Image
                  src={doc.image}
                  alt={doc.title}
                  fill
                  className='object-contain p-4 transition-transform duration-300 group-hover:scale-105'
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw'
                />
              </div>
              <div className='border-t border-default-200 p-3 sm:p-5'>
                <div className='mb-2 flex items-center gap-2'>
                  <Icon icon={doc.icon} className='h-4 w-4 text-primary' />
                  <h3 className='text-sm font-bold text-foreground'>{doc.title}</h3>
                </div>
                <p className='text-xs leading-relaxed text-default-500'>{doc.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DocumentTypesSection
