'use client'

import Icon from '@/components/icon'

export type NavKey = 'dashboard' | 'templates' | 'history' | 'apikeys' | 'settings'

const NAV: { key: NavKey; icon: string; label: string }[] = [
  { key: 'dashboard', icon: 'lucide:layout-dashboard', label: 'Dashboard' },
  { key: 'templates', icon: 'lucide:file-text', label: 'Templates' },
  { key: 'history', icon: 'lucide:history', label: 'History' },
  { key: 'apikeys', icon: 'lucide:key', label: 'API Keys' },
  { key: 'settings', icon: 'lucide:settings', label: 'Settings' }
]

/**
 * App shell shared by the 4 animated demo steps.
 * Mimics the real Qorstack Report dashboard chrome (sidebar + project header)
 * so animation content sits in a familiar context.
 */
export const DemoShell = ({
  active,
  projectName = 'Invoice Reports',
  headerRight,
  children
}: {
  active: NavKey
  projectName?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
}) => {
  return (
    <div className='absolute inset-0 flex bg-content2 text-foreground dark:bg-content1'>
      {/* Sidebar */}
      <aside className='flex w-[120px] shrink-0 flex-col gap-1 border-r border-default-200/70 bg-content1 p-2 dark:border-default-200/10 dark:bg-content2'>
        <div className='mb-2 flex items-center gap-1.5 px-2 py-2'>
          <div className='flex h-5 w-5 items-center justify-center rounded bg-foreground text-background'>
            <span className='font-headline text-[10px] font-bold'>Q</span>
          </div>
          <span className='font-headline text-[11px] font-bold tracking-tight'>Qorstack</span>
        </div>
        <div className='mb-2 inline-flex items-center justify-between rounded bg-content2 px-2 py-1.5 dark:bg-content3'>
          <span className='truncate font-label text-[10px] font-bold text-default-600'>{projectName}</span>
          <Icon icon='lucide:chevron-down' className='h-3 w-3 text-default-400' />
        </div>
        <span className='px-2 py-1 font-label text-[8.5px] font-bold uppercase tracking-wider text-default-400'>
          Workspace
        </span>
        {NAV.map(item => {
          const isActive = item.key === active
          return (
            <div
              key={item.key}
              className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-[10.5px] font-semibold transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-default-500'
              }`}>
              <Icon icon={item.icon} className='h-3 w-3' />
              {item.label}
            </div>
          )
        })}
      </aside>

      {/* Main area */}
      <div className='flex min-w-0 flex-1 flex-col'>
        {/* Top header */}
        <header className='flex h-9 items-center justify-between border-b border-default-200/70 px-3 dark:border-default-200/10'>
          <div className='flex items-center gap-2'>
            <Icon icon='lucide:box' className='h-3.5 w-3.5 text-primary' />
            <span className='text-[11px] font-bold text-foreground'>{projectName}</span>
          </div>
          <div className='flex items-center gap-1.5'>
            {headerRight}
            <Icon icon='lucide:search' className='h-3.5 w-3.5 text-default-400' />
            <Icon icon='lucide:moon' className='h-3.5 w-3.5 text-default-400' />
            <div className='flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-label text-[9px] font-bold text-primary'>
              S
            </div>
          </div>
        </header>

        {/* Content slot */}
        <main className='relative flex-1 overflow-hidden'>{children}</main>
      </div>
    </div>
  )
}
