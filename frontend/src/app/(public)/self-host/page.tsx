'use client'

import Icon from '@/components/icon'
import { motion } from 'framer-motion'
import { CodeBlock } from '@/components/docs/CodeBlock'
import SelfhostPlanSection from '@/views/marketing/selfhost-plan-section'
import { BrandChip } from '@/components/ui/BrandChip'
import { dockerComposeYaml, envExample } from '@/generated/selfhost-files'

const GITHUB_URL = 'https://github.com/qorstack/qorstack-report'
const COMPOSE_URL = '/selfhost/docker-compose.yml'
const ENV_URL = '/selfhost/.env.example'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] as const }
}

const requirements = [
  { icon: 'lucide:box', label: 'Docker', detail: '24+' },
  { icon: 'lucide:layers', label: 'Docker Compose', detail: 'v2+' },
  { icon: 'lucide:cpu', label: 'RAM', detail: '2 GB' },
  { icon: 'lucide:hard-drive', label: 'Disk', detail: '5 GB' }
]

const services = [
  { icon: 'lucide:layout-dashboard', label: 'Frontend', desc: 'Next.js web UI' },
  { icon: 'lucide:server', label: 'Backend', desc: '.NET API + render engine' },
  { icon: 'lucide:database', label: 'PostgreSQL', desc: 'Application database' },
  { icon: 'lucide:hard-drive', label: 'MinIO', desc: 'Template & report storage' },
  { icon: 'lucide:type', label: 'Font Syncer', desc: 'Mirrors fonts into the render volume' },
  { icon: 'lucide:file-text', label: 'Gotenberg', desc: 'DOCX/XLSX → PDF conversion' }
]

const serviceUrls = [
  { label: 'Web UI', url: 'http://localhost:3000', login: 'admin / admin' },
  { label: 'API', url: 'http://localhost:8080', login: '—' },
  { label: 'MinIO console', url: 'http://localhost:9001', login: 'from .env' }
]

const mustChange = [
  { name: 'ADMIN_EMAIL', purpose: 'Initial admin login' },
  { name: 'ADMIN_PASSWORD', purpose: 'Initial admin password' },
  { name: 'DB_PASSWORD', purpose: 'PostgreSQL password' },
  { name: 'MINIO_ACCESS_KEY', purpose: 'MinIO root/access key' },
  { name: 'MINIO_SECRET_KEY', purpose: 'MinIO root/secret key' },
  { name: 'JWT_KEY', purpose: 'JWT signing key — at least 32 characters' },
  { name: 'ENCRYPTION_KEY', purpose: 'AES key — exactly 32 characters' },
  { name: 'ENCRYPTION_IV', purpose: 'AES IV — exactly 16 characters' }
]

const troubleshooting = [
  { symptom: 'Login fails on first run', check: 'ADMIN_EMAIL, ADMIN_PASSWORD, backend logs' },
  { symptom: 'Frontend cannot call API', check: 'API_URL, CORS_ORIGINS' },
  { symptom: 'Previews / downloads fail', check: 'MINIO_PUBLIC_ENDPOINT reachable from the browser' },
  { symptom: 'PDF conversion fails', check: 'gotenberg logs' },
  { symptom: 'Custom fonts missing', check: 'font-syncer logs' }
]

const SectionLabel = ({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) => (
  <h2
    className={`mb-1 font-label text-[11px] font-bold uppercase tracking-[0.15em] ${
      accent ? 'text-primary' : 'text-default-500'
    }`}>
    {children}
  </h2>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className='mb-8 font-headline text-2xl font-bold text-foreground'>{children}</p>
)

const Subhead = ({ children }: { children: React.ReactNode }) => (
  <p className='mb-3 text-[11px] font-bold uppercase tracking-wider text-default-500'>{children}</p>
)

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className='inline-flex h-5 items-center rounded-md bg-content2 px-1.5 font-mono text-[10.5px] font-medium text-foreground ring-1 ring-inset ring-default-200 dark:bg-white/5 dark:ring-white/10'>
    {children}
  </span>
)

interface StepProps {
  number: string
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  last?: boolean
}

const Step = ({ number, title, description, children, last }: StepProps) => (
  <motion.div {...fadeUp} className='flex gap-5'>
    <div className='flex shrink-0 flex-col items-center'>
      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-foreground font-mono text-sm font-bold text-background'>
        {number}
      </div>
      {!last && <div className='mt-2 w-px flex-1 bg-default-200 dark:bg-default-200/20' />}
    </div>
    <div className={`flex-1 ${last ? '' : 'pb-10'}`}>
      <h3 className='mb-1 font-headline text-base font-bold text-foreground'>{title}</h3>
      {description && <div className='mb-3 text-sm leading-relaxed text-default-600'>{description}</div>}
      {children}
    </div>
  </motion.div>
)

export default function SelfHostPage() {
  return (
    <div className='min-h-screen bg-background'>
      {/* ── 1. Hero ── */}
      <section className='relative overflow-hidden border-b border-default-200/70 py-24 dark:border-default-200/10'>
        <div className='pointer-events-none absolute inset-0 bg-dots opacity-20 dark:opacity-10' />
        <div className='pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/8 blur-[120px] dark:bg-primary/15' />

        <div className='relative mx-auto max-w-4xl px-6 text-center'>
          <motion.div
            {...fadeUp}
            className='mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-primary/8 px-3.5 py-1.5 font-label text-[11px] font-bold uppercase tracking-[0.15em] text-primary ring-1 ring-inset ring-primary/20'>
            <Icon icon='lucide:server' className='h-3.5 w-3.5' />
            Self-Host Guide
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className='font-headline font-extrabold leading-[0.95] tracking-[-0.03em] text-foreground'
            style={{ fontSize: 'clamp(2.5rem, 1.5rem + 5vw, 5rem)' }}>
            Two files.
            <br />
            <span className='bg-gradient-to-br from-primary via-primary to-primary/70 bg-clip-text text-transparent'>
              One command.
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.14 }}
            className='mx-auto mt-6 max-w-xl text-base leading-relaxed text-default-600 sm:text-lg'>
            Download{' '}
            <code className='rounded bg-content2 px-1.5 py-0.5 font-mono text-[0.9em] text-primary'>
              docker-compose.yml
            </code>{' '}
            and <code className='rounded bg-content2 px-1.5 py-0.5 font-mono text-[0.9em] text-primary'>.env</code>, run{' '}
            <code className='rounded bg-content2 px-1.5 py-0.5 font-mono text-[0.9em] text-primary'>
              docker compose up
            </code>
            , done.
            <span className='mt-1 block text-default-500'>
              MIT-licensed. No usage limits. Your data stays on your network.
            </span>
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='mt-8 flex flex-wrap items-center justify-center gap-2.5'>
            <a
              href='#quick-start'
              className='inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 font-label text-sm font-bold tracking-wide text-background transition-transform hover:scale-[1.02]'>
              <Icon icon='lucide:rocket' className='h-4 w-4' />
              Start in 4 steps
            </a>
            <a
              href={GITHUB_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-md bg-content2 px-6 py-3 font-label text-sm font-bold tracking-wide text-foreground transition-colors hover:bg-content3 dark:bg-white/8 dark:hover:bg-white/12'>
              <Icon icon='lucide:github' className='h-4 w-4 text-default-500' />
              View on GitHub
            </a>
          </motion.div>

          {/* Quick stat rail */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.26 }}
            className='mx-auto mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-default-500'>
            {['MIT Licensed', 'Zero Telemetry', 'Self-Hosted Pro Available', 'Production Ready'].map((tag, i) => (
              <span key={tag} className='flex items-center gap-3'>
                {i > 0 && <span className='h-1 w-1 rounded-full bg-default-300 dark:bg-default-400' />}
                <span>{tag}</span>
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 2. Requirements ── */}
      <section className='border-b border-default-200/70 py-14 dark:border-default-200/10'>
        <div className='mx-auto max-w-4xl px-6'>
          <SectionLabel>Requirements</SectionLabel>
          <p className='mb-6 font-headline text-lg font-bold text-foreground'>Anything that can run Docker.</p>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {requirements.map(req => (
              <motion.div
                key={req.label}
                {...fadeUp}
                className='flex items-center gap-3 rounded-lg border border-default-200/70 bg-content1 p-4 dark:border-default-200/10 dark:bg-content2'>
                <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                  <Icon icon={req.icon} className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <p className='text-sm font-bold text-foreground'>{req.label}</p>
                  <p className='font-mono text-[11px] text-default-500'>{req.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Quick Start — step by step ── */}
      <section id='quick-start' className='border-b border-default-200/70 py-16 dark:border-default-200/10'>
        <div className='mx-auto max-w-4xl px-6'>
          <SectionLabel accent>Quick Start</SectionLabel>
          <SectionTitle>From zero to running in 4 steps.</SectionTitle>

          <div>
            <Step
              number='01'
              title='Download the two files'
              description='That is the entire deploy package. No clone, no build step. Skim each file below, then grab the download from the top-right.'>
              <div className='space-y-3'>
                <CodeBlock
                  code={dockerComposeYaml}
                  language='yaml'
                  title='docker-compose.yml'
                  maxHeight={300}
                  downloadHref={COMPOSE_URL}
                  downloadFilename='docker-compose.yml'
                />
                <CodeBlock
                  code={envExample}
                  language='ini'
                  title='.env.example'
                  maxHeight={260}
                  downloadHref={ENV_URL}
                  downloadFilename='.env.example'
                />
              </div>
            </Step>

            <Step
              number='02'
              title='Rename .env.example → .env'
              description={
                <>
                  Place both files in the same folder, then rename. The defaults are safe for{' '}
                  <Pill>localhost</Pill> — you can change secrets later before going to production.
                </>
              }>
              <CodeBlock code='mv .env.example .env' language='bash' showHeader={false} compact showLineNumbers={false} />
            </Step>

            <Step
              number='03'
              title='Start the stack'
              description='Docker pulls the images, creates volumes, and brings up everything in order.'>
              <CodeBlock
                code='docker compose up -d'
                language='bash'
                showHeader={false}
                compact
                showLineNumbers={false}
              />
              <p className='mt-2 text-[12.5px] text-default-500'>
                First run takes ~1–2 minutes while images download.
              </p>
            </Step>

            <Step
              number='04'
              title='Open the web UI and log in'
              description={
                <>
                  Sign in with <Pill>admin</Pill> / <Pill>admin</Pill>. Then change the password from{' '}
                  <Pill>Settings</Pill>.
                </>
              }
              last>
              <div className='grid gap-3 sm:grid-cols-3'>
                {serviceUrls.map(s => (
                  <div
                    key={s.label}
                    className='rounded-lg border border-default-200/70 bg-content1 p-3.5 dark:border-default-200/10 dark:bg-content2'>
                    <p className='text-[10.5px] font-bold uppercase tracking-wider text-default-500'>{s.label}</p>
                    <a
                      href={s.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='mt-1.5 inline-flex max-w-full items-center gap-1 break-all rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[12.5px] font-bold text-primary-600 transition-colors hover:bg-primary/15 dark:bg-primary-500/15 dark:text-primary-400 dark:hover:bg-primary-500/25'>
                      {s.url}
                      <Icon icon='lucide:arrow-up-right' className='h-3 w-3 shrink-0 opacity-80' />
                    </a>
                    <p className='mt-1.5 text-[11px] text-default-500'>
                      Login: <span className='font-mono text-default-700 dark:text-default-300'>{s.login}</span>
                    </p>
                  </div>
                ))}
              </div>
            </Step>
          </div>
        </div>
      </section>

      {/* ── 4. What's inside ── */}
      <section className='border-b border-default-200/70 py-16 dark:border-default-200/10'>
        <div className='mx-auto max-w-4xl px-6'>
          <SectionLabel>What's inside</SectionLabel>
          <SectionTitle>Six services. One compose file.</SectionTitle>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {services.map(svc => (
              <motion.div
                key={svc.label}
                {...fadeUp}
                className='flex items-start gap-3 rounded-lg border border-default-200/70 bg-content1 p-4 dark:border-default-200/10 dark:bg-content2'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10'>
                  <Icon icon={svc.icon} className='h-4 w-4 text-primary' />
                </div>
                <div className='min-w-0'>
                  <p className='text-sm font-bold text-foreground'>{svc.label}</p>
                  <p className='mt-0.5 text-xs leading-snug text-default-500'>{svc.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Going to production ── */}
      <section className='border-b border-default-200/70 py-16 dark:border-default-200/10'>
        <div className='mx-auto max-w-4xl px-6'>
          <SectionLabel accent>Going to production</SectionLabel>
          <SectionTitle>Three things to handle before going live.</SectionTitle>

          {/* 6a — Secrets */}
          <div className='mb-12'>
            <div className='mb-3 flex items-center gap-2'>
              <BrandChip tone='primary' size='sm' mono>
                A
              </BrandChip>
              <h3 className='font-headline text-lg font-bold text-foreground'>Change these secrets</h3>
            </div>
            <p className='mb-4 max-w-2xl text-sm text-default-600'>
              The defaults work on <Pill>localhost</Pill> but must be rotated before you expose the instance.
            </p>

            <div className='overflow-hidden rounded-xl border border-default-200/70 dark:border-default-200/10'>
              <table className='w-full text-left text-sm'>
                <thead className='bg-content2 text-[11px] font-bold uppercase tracking-wider text-default-500 dark:bg-white/5'>
                  <tr>
                    <th className='px-4 py-2.5'>Variable</th>
                    <th className='px-4 py-2.5'>Purpose</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-default-200/60 dark:divide-default-200/10'>
                  {mustChange.map(v => (
                    <tr key={v.name} className='bg-content1 dark:bg-content2'>
                      <td className='px-4 py-2.5'>
                        <Pill>{v.name}</Pill>
                      </td>
                      <td className='px-4 py-2.5 text-default-600 dark:text-default-400'>{v.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className='mt-4'>
              <Subhead>Generate strong secrets</Subhead>
              <CodeBlock
                code={`openssl rand -hex 32   # JWT_KEY
openssl rand -hex 16   # ENCRYPTION_KEY  (32 hex chars)
openssl rand -hex 8    # ENCRYPTION_IV   (16 hex chars)`}
                language='bash'
                showHeader={false}
                compact
              />
            </div>

            <div className='mt-4 flex items-start gap-2 rounded-lg border border-warning-200/60 bg-warning-50/40 p-3 dark:border-warning-200/20 dark:bg-warning-100/5'>
              <Icon
                icon='lucide:triangle-alert'
                className='mt-0.5 h-4 w-4 shrink-0 text-warning-600 dark:text-warning-400'
              />
              <p className='text-[12.5px] leading-relaxed text-default-700 dark:text-default-300'>
                The admin user is re-applied on every restart — blank out <Pill>ADMIN_PASSWORD</Pill> after first login
                so the seeder skips on subsequent boots.
              </p>
            </div>
          </div>

          {/* 6b — Network */}
          <div className='mb-12'>
            <div className='mb-3 flex items-center gap-2'>
              <BrandChip tone='primary' size='sm' mono>
                B
              </BrandChip>
              <h3 className='font-headline text-lg font-bold text-foreground'>Reach it from another device</h3>
            </div>
            <p className='mb-4 max-w-2xl text-sm text-default-600'>
              When opening the UI from another device, <Pill>localhost</Pill> points to <em>that</em> device, not the
              server. Update <Pill>.env</Pill> with browser-reachable URLs:
            </p>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Subhead>VPN / LAN</Subhead>
                <CodeBlock
                  code={`API_URL=http://192.168.1.10:8080
CORS_ORIGINS=http://192.168.1.10:3000
MINIO_PUBLIC_ENDPOINT=http://192.168.1.10:9000`}
                  language='ini'
                  showHeader={false}
                  compact
                  showLineNumbers={false}
                />
              </div>
              <div>
                <Subhead>Domain + HTTPS</Subhead>
                <CodeBlock
                  code={`API_URL=https://api.your-domain.com
CORS_ORIGINS=https://your-domain.com
MINIO_PUBLIC_ENDPOINT=https://minio.your-domain.com`}
                  language='ini'
                  showHeader={false}
                  compact
                  showLineNumbers={false}
                />
              </div>
            </div>
          </div>

          {/* 6c — External services */}
          <div>
            <div className='mb-3 flex items-center gap-2'>
              <BrandChip tone='primary' size='sm' mono>
                C
              </BrandChip>
              <h3 className='font-headline text-lg font-bold text-foreground'>Use external PostgreSQL or S3</h3>
            </div>
            <p className='mb-4 max-w-2xl text-sm text-default-600'>
              Already running your own database or object store? Point the stack at it and disable the bundled service.
            </p>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Subhead>Your own PostgreSQL</Subhead>
                <CodeBlock
                  code={`DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=qorstack_report
DB_USER=postgres
DB_PASSWORD=your-db-password`}
                  language='ini'
                  showHeader={false}
                  compact
                  showLineNumbers={false}
                />
                <p className='mt-2 text-[11.5px] text-default-500'>
                  Then disable the <Pill>postgres</Pill> service in <Pill>docker-compose.yml</Pill>.
                </p>
              </div>
              <div>
                <Subhead>S3-compatible store</Subhead>
                <CodeBlock
                  code={`MINIO_ENDPOINT=your-minio-host:9000
MINIO_PUBLIC_ENDPOINT=https://minio.your-domain.com
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...`}
                  language='ini'
                  showHeader={false}
                  compact
                  showLineNumbers={false}
                />
                <p className='mt-2 text-[11.5px] text-default-500'>
                  Then disable the <Pill>minio</Pill> service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Activate Pro ── */}
      <section className='border-b border-default-200/70 py-16 dark:border-default-200/10'>
        <div className='mx-auto max-w-4xl px-6'>
          <SectionLabel accent>Activate Pro</SectionLabel>
          <SectionTitle>Already have a license?</SectionTitle>
          <p className='mb-6 max-w-2xl text-sm text-default-600'>
            Drop your license file next to <Pill>docker-compose.yml</Pill> and restart the backend. (Feature comparison
            is at the bottom of this page.)
          </p>
          <div className='rounded-xl border border-default-200/70 bg-content1 p-5 dark:border-default-200/10 dark:bg-content2'>
            <div className='mb-3 flex items-center gap-2'>
              <Icon icon='lucide:file-key-2' className='h-4 w-4 text-primary' />
              <p className='text-sm font-bold text-foreground'>With a license file</p>
            </div>
            <ol className='ml-4 list-decimal space-y-1 text-[12.5px] text-default-600 dark:text-default-400'>
              <li>
                Place <Pill>license.json</Pill> next to <Pill>docker-compose.yml</Pill>.
              </li>
              <li>
                Uncomment <Pill>Pro__LicenseFile</Pill> env and the <Pill>volumes:</Pill> block under{' '}
                <Pill>backend</Pill> (see diff below).
              </li>
              <li>
                Run <Pill>docker compose restart backend</Pill>.
              </li>
            </ol>

            <div className='mt-5 grid gap-3 sm:grid-cols-2'>
              <div>
                <div className='mb-2 flex items-center gap-2'>
                  <BrandChip tone='neutral' size='xs' uppercase>
                    Before
                  </BrandChip>
                  <span className='text-[11px] text-default-500'>Free — license lines commented out</span>
                </div>
                <CodeBlock
                  code={`backend:
  environment:
    # - Pro__LicenseFile=/app/license.json
  # volumes:
  #   - ./license.json:/app/license.json:ro`}
                  language='yaml'
                  showHeader={false}
                  compact
                  showLineNumbers={false}
                />
              </div>
              <div>
                <div className='mb-2 flex items-center gap-2'>
                  <BrandChip tone='primary' size='xs' uppercase>
                    After
                  </BrandChip>
                  <span className='text-[11px] text-default-500'>Pro — both blocks uncommented</span>
                </div>
                <CodeBlock
                  code={`backend:
  environment:
    - Pro__LicenseFile=/app/license.json
  volumes:
    - ./license.json:/app/license.json:ro`}
                  language='yaml'
                  showHeader={false}
                  compact
                  showLineNumbers={false}
                />
              </div>
            </div>

            <p className='mt-4 text-[11.5px] text-default-500'>
              License is validated offline — no call to Qorstack.
            </p>
          </div>

          <p className='mt-5 text-[12.5px] text-default-500'>
            Check active flags:{' '}
            <a
              href='http://localhost:8080/features'
              target='_blank'
              rel='noopener noreferrer'
              className='font-mono text-primary hover:underline'>
              curl http://localhost:8080/features
            </a>
          </p>
        </div>
      </section>

      {/* ── 8. Day-2 ops ── */}
      <section className='border-b border-default-200/70 py-14 dark:border-default-200/10'>
        <div className='mx-auto max-w-4xl px-6'>
          <SectionLabel>Day-2 ops</SectionLabel>
          <SectionTitle>Update, stop, wipe.</SectionTitle>
          <div className='grid gap-3 sm:grid-cols-3'>
            <div>
              <Subhead>Update</Subhead>
              <CodeBlock
                code={`docker compose pull
docker compose up -d`}
                language='bash'
                showHeader={false}
                compact
                showLineNumbers={false}
              />
            </div>
            <div>
              <Subhead>Stop (keep data)</Subhead>
              <CodeBlock code='docker compose down' language='bash' showHeader={false} compact showLineNumbers={false} />
            </div>
            <div>
              <p className='mb-3 text-[11px] font-bold uppercase tracking-wider text-danger-600'>Stop + wipe data</p>
              <CodeBlock
                code='docker compose down -v'
                language='bash'
                showHeader={false}
                compact
                showLineNumbers={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Troubleshooting ── */}
      <section className='border-b border-default-200/70 py-14 dark:border-default-200/10'>
        <div className='mx-auto max-w-4xl px-6'>
          <SectionLabel>Troubleshooting</SectionLabel>
          <SectionTitle>Something not working?</SectionTitle>

          <div className='mb-5'>
            <Subhead>Check the logs</Subhead>
            <CodeBlock
              code={`docker compose logs backend
docker compose logs frontend
docker compose logs gotenberg
docker compose logs font-syncer`}
              language='bash'
              showHeader={false}
              compact
              showLineNumbers={false}
            />
          </div>

          <div className='overflow-hidden rounded-xl border border-default-200/70 dark:border-default-200/10'>
            <table className='w-full text-left text-sm'>
              <thead className='bg-content2 text-[11px] font-bold uppercase tracking-wider text-default-500 dark:bg-white/5'>
                <tr>
                  <th className='px-4 py-2.5'>Symptom</th>
                  <th className='px-4 py-2.5'>Check</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-default-200/60 dark:divide-default-200/10'>
                {troubleshooting.map(t => (
                  <tr key={t.symptom} className='bg-content1 dark:bg-content2'>
                    <td className='px-4 py-2.5 text-default-700 dark:text-default-300'>{t.symptom}</td>
                    <td className='px-4 py-2.5 text-default-600 dark:text-default-400'>{t.check}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='mt-6 flex flex-wrap gap-3'>
            <a
              href={GITHUB_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 font-label text-[12px] font-bold tracking-wide text-background transition-transform hover:scale-[1.02]'>
              <Icon icon='lucide:github' className='h-3.5 w-3.5' />
              View on GitHub
              <Icon icon='lucide:arrow-up-right' className='h-3 w-3' />
            </a>
            <a
              href={`${GITHUB_URL}/issues`}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-md bg-content2 px-4 py-2.5 font-label text-[12px] font-bold tracking-wide text-foreground transition-colors hover:bg-content3 dark:bg-white/8 dark:hover:bg-white/12'>
              <Icon icon='lucide:message-circle-question' className='h-3.5 w-3.5 text-default-500' />
              Report an issue
            </a>
          </div>
        </div>
      </section>

      {/* ── 10. Free vs Pro (single comparison) ── */}
      <SelfhostPlanSection />
    </div>
  )
}
