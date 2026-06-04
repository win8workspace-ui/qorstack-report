'use client'

import Icon from '@/components/icon'
import { useAuth } from '@/providers/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const easeExpoOut = [0.16, 1, 0.3, 1] as const
const isCloud = process.env.NEXT_PUBLIC_SITE_MODE === 'cloud'

const SHOWCASES = [
  {
    id: 'invoice',
    label: 'Invoice',
    accent: 'text-rose-400',
    accentDot: 'bg-rose-400',
    badge: 'PDF',
    badgeClass: 'bg-rose-500/15 text-rose-400 ring-rose-500/30',
    image: '/images/example-template-render/current-invoice.svg',
    meta: 'invoice-2026-001.pdf · 142 KB'
  },
  {
    id: 'excel',
    label: 'Excel report',
    accent: 'text-emerald-400',
    accentDot: 'bg-emerald-400',
    badge: 'XLSX',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    image: '/images/example-template-render/current-excel.svg',
    meta: 'sales-q1-2026.xlsx · 38 KB'
  },
  {
    id: 'contract',
    label: 'Protected contract',
    accent: 'text-amber-400',
    accentDot: 'bg-amber-400',
    badge: 'PDF · Encrypted',
    badgeClass: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    image: '/images/example-template-render/current-contract.svg',
    meta: 'msa-2026-acme.pdf · 96 KB'
  },
  {
    id: 'label',
    label: 'Shipping label',
    accent: 'text-sky-400',
    accentDot: 'bg-sky-400',
    badge: 'PDF · Barcode',
    badgeClass: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
    image: '/images/example-template-render/current-label.svg',
    meta: 'label-TH-2026-001.pdf · 22 KB'
  },
  {
    id: 'ticket',
    label: 'Event ticket',
    accent: 'text-violet-400',
    accentDot: 'bg-violet-400',
    badge: 'PDF · QR',
    badgeClass: 'bg-violet-500/15 text-violet-400 ring-violet-500/30',
    image: '/images/example-template-render/current-ticket.svg',
    meta: 'tix-dev-26-A42.pdf · 41 KB'
  }
] as const

const ROTATE_MS = 3200

const HeroSection = () => {
  const { openAuthModal, user, navigateHome } = useAuth()
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SHOWCASES.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [])

  const active = SHOWCASES[idx]
  const next = SHOWCASES[(idx + 1) % SHOWCASES.length]
  const next2 = SHOWCASES[(idx + 2) % SHOWCASES.length]

  return (
    <section className='relative flex min-h-[82vh] items-center overflow-hidden pb-12 pt-20 sm:pt-24 lg:pb-10 lg:pt-28'>
      {/* ── Background layers ── */}

      {/* Grid pattern (fades at edges) */}
      <div
        className='pointer-events-none absolute inset-0 text-slate-400/60 opacity-40 dark:text-slate-500 dark:opacity-25'
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 80%)'
        }}
      />

      {/* Dot texture overlay */}
      <div className='pointer-events-none absolute inset-0 bg-dots opacity-[0.12] dark:opacity-10' />

      {/* Animated gradient orbs — clean slate/cyan in light, vivid in dark */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className='pointer-events-none absolute -left-32 top-1/4 h-[520px] w-[520px] rounded-full bg-rose-200/35 blur-[140px] dark:bg-primary/15'
      />
      <motion.div
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1], x: [0, -24, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className='pointer-events-none absolute right-0 top-1/3 h-[540px] w-[540px] translate-x-1/4 rounded-full bg-emerald-200/30 blur-[140px] dark:bg-violet-500/15'
      />

      {/* Top fade */}
      <div className='pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent' />
      {/* Bottom fade */}
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent' />

      <div className='relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid items-center gap-8 sm:gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24 xl:gap-32'>
          {/* ── LEFT: Text ── */}
          <div className='order-1 text-center lg:order-1 lg:text-left'>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: easeExpoOut }}
              className='mb-5 inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 font-label text-[10.5px] font-bold uppercase tracking-[0.15em] text-primary ring-1 ring-inset ring-primary/20 sm:mb-6'>
              <Icon icon='mdi:sparkles' className='h-3 w-3' />
              Open-Source · Self-Hosted · Free
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease: easeExpoOut }}
              className='font-headline font-extrabold leading-[0.95] tracking-[-0.03em] text-foreground'
              style={{ fontSize: 'clamp(2.2rem, 1.2rem + 4vw, 4.5rem)' }}>
              Templates to
              <br />
              <span className='bg-gradient-to-br from-[#E11D2E] via-[#C81E2B] to-[#9A1722] bg-clip-text text-transparent dark:from-[#FF5A5F] dark:via-[#F4434B] dark:to-[#D7333B]'>
                PDF
              </span>
              <span className='text-foreground'> &amp; </span>
              <span className='bg-gradient-to-br from-[#1E8A50] via-[#137A43] to-[#0C5F33] bg-clip-text text-transparent dark:from-[#3FCB7E] dark:via-[#2EB36A] dark:to-[#1E9457]'>
                Excel
              </span>
              <span className='text-default-300 dark:text-default-500'>,</span>
              <br />
              <span className='italic text-default-400 dark:text-default-500'>on demand.</span>
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.18, ease: easeExpoOut }}
              className='mx-auto mt-5 max-w-md text-[14px] leading-relaxed text-default-600 sm:mt-6 sm:text-[15px] lg:mx-0'>
              Upload Word or Excel templates, POST JSON, receive production documents.{' '}
              <span className='block text-default-500'>Self-host the full stack when data must stay inside your network.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26, ease: easeExpoOut }}
              className='mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:mt-7 lg:justify-start'>
              <a
                href='https://github.com/qorstack/qorstack-report'
                target='_blank'
                rel='noopener noreferrer'
                className='group inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 font-label text-sm font-bold tracking-wide text-background transition-transform hover:scale-[1.02]'>
                <Icon icon='lucide:github' className='h-4 w-4' />
                Deploy with Docker
                <Icon icon='lucide:arrow-right' className='h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
              </a>
              {isCloud ? (
                <Link
                  href='/docs'
                  className='inline-flex items-center gap-2 rounded-md bg-content2 px-5 py-2.5 font-label text-sm font-bold tracking-wide text-foreground transition-colors hover:bg-content3 dark:bg-white/8 dark:hover:bg-white/12'>
                  <Icon icon='lucide:book-open' className='h-4 w-4 text-default-500' />
                  Read the Docs
                </Link>
              ) : (
                <button
                  onClick={() => (user ? navigateHome() : openAuthModal('register'))}
                  className='inline-flex items-center gap-2 rounded-md bg-content2 px-5 py-2.5 font-label text-sm font-bold tracking-wide text-foreground transition-colors hover:bg-content3 dark:bg-white/8 dark:hover:bg-white/12'>
                  <Icon icon='lucide:flask-conical' className='h-4 w-4 text-default-500' />
                  {user ? 'Go to Dashboard' : 'Open Dashboard'}
                </button>
              )}
            </motion.div>

            {/* Tag rail */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.34, ease: easeExpoOut }}
              className='mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.12em] text-default-500 sm:mt-8 lg:justify-start'>
              {['MIT Licensed', 'Word + Excel', 'PDF · DOCX · Excel', 'REST JSON'].map((tag, i) => (
                <span key={tag} className='flex items-center gap-3'>
                  {i > 0 && <span className='h-1 w-1 rounded-full bg-default-300 dark:bg-default-400' />}
                  <span>{tag}</span>
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Carousel showcase ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: easeExpoOut }}
            className='order-2 lg:order-2'>
            <div className='relative mx-auto w-full'>
              {/* Soft ambient glow behind active card */}
              <div
                aria-hidden
                className='pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[360px] -translate-x-1/2 -translate-y-[55%] rounded-full bg-slate-400/20 blur-[110px] dark:bg-primary/15'
              />

              {/* Carousel — flex layout, no overlap */}
              <div className='relative flex items-end justify-center gap-2 sm:gap-3 lg:gap-4'>
                {/* Prev peek (left, smaller, tilted away) */}
                <motion.div
                  key={`prev-${next2.id}`}
                  initial={{ opacity: 0, rotateY: 0 }}
                  animate={{ opacity: 0.75, rotateY: 14 }}
                  transition={{ duration: 0.6, ease: easeExpoOut }}
                  style={{ transformOrigin: 'right center', perspective: '1000px' }}
                  className='pointer-events-none relative hidden h-[240px] w-[160px] shrink-0 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-default-300/30 sm:block sm:h-[270px] sm:w-[175px] lg:h-[300px] lg:w-[195px] dark:ring-default-200/10'>
                  <Image src={next2.image} alt='' fill sizes='195px' className='object-cover object-top' />
                  {/* fade-to-bg overlay */}
                  <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent dark:from-background/70' />
                </motion.div>

                {/* Active (centered, largest) */}
                <div className='relative z-10 shrink-0'>
                  <AnimatePresence mode='wait'>
                    <motion.div
                      key={`active-${active.id}`}
                      initial={{ x: -120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 120, opacity: 0 }}
                      transition={{ duration: 0.55, ease: easeExpoOut }}
                      className='relative h-[340px] w-[240px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)] ring-1 ring-default-300/40 sm:h-[390px] sm:w-[265px] lg:h-[440px] lg:w-[290px] dark:ring-default-200/15'>
                      <Image
                        src={active.image}
                        alt={active.label}
                        fill
                        priority
                        sizes='290px'
                        className='object-contain'
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Format badge — top-right of active */}
                  <AnimatePresence mode='wait'>
                    <motion.div
                      key={`badge-${active.id}`}
                      initial={{ opacity: 0, y: -4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35 }}
                      className={`absolute -right-2 top-4 z-10 inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1.5 font-label text-[10px] font-bold uppercase tracking-wider shadow-lg ring-1 ring-inset ${active.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${active.accentDot}`} />
                      {active.badge}
                    </motion.div>
                  </AnimatePresence>

                  {/* Meta label — bottom-left of active */}
                  <AnimatePresence mode='wait'>
                    <motion.div
                      key={`label-${active.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.35 }}
                      className='absolute -bottom-3 -left-3 z-10 flex items-center gap-2 rounded-md bg-background px-3 py-2 shadow-lg ring-1 ring-inset ring-default-300/40 dark:ring-default-400/15'>
                      <Icon icon='lucide:file-check' className={`h-4 w-4 ${active.accent}`} />
                      <div>
                        <div className='font-headline text-[11px] font-bold leading-none text-foreground'>{active.label}</div>
                        <div className='mt-0.5 font-mono text-[9px] text-default-500'>{active.meta}</div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Next peek (right, smaller, tilted away) */}
                <motion.div
                  key={`peek-${next.id}`}
                  initial={{ opacity: 0, rotateY: 0 }}
                  animate={{ opacity: 0.75, rotateY: -14 }}
                  transition={{ duration: 0.6, ease: easeExpoOut }}
                  style={{ transformOrigin: 'left center', perspective: '1000px' }}
                  className='pointer-events-none relative hidden h-[240px] w-[160px] shrink-0 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-default-300/30 sm:block sm:h-[270px] sm:w-[175px] lg:h-[300px] lg:w-[195px] dark:ring-default-200/10'>
                  <Image src={next.image} alt='' fill sizes='195px' className='object-cover object-top' />
                  {/* fade-to-bg overlay */}
                  <div className='pointer-events-none absolute inset-0 bg-gradient-to-l from-background/60 via-transparent to-transparent dark:from-background/70' />
                </motion.div>
              </div>

              {/* Thumbnail strip */}
              <div className='mt-6 flex items-center justify-center gap-2 px-4'>
                {SHOWCASES.map((s, i) => {
                  const isActive = i === idx
                  return (
                    <button
                      key={s.id}
                      onClick={() => setIdx(i)}
                      aria-label={`Show ${s.label}`}
                      className={`group relative flex shrink-0 flex-col items-center transition-all ${
                        isActive ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                      }`}>
                      <div
                        className={`relative h-14 w-10 overflow-hidden rounded-md bg-white shadow-sm ring-1 transition-all sm:h-16 sm:w-12 ${
                          isActive
                            ? 'scale-110 ring-foreground ring-2'
                            : 'ring-default-300/40 dark:ring-default-300/20'
                        }`}>
                        <Image src={s.image} alt={s.label} fill sizes='48px' className='object-cover object-top' />
                      </div>
                      <span
                        className={`mt-1.5 font-label text-[8.5px] font-bold uppercase tracking-wider transition-colors ${
                          isActive ? s.accent : 'text-default-400'
                        }`}>
                        {s.label.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
