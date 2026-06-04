'use client'

import React from 'react'
import Icon from '@/components/icon'

type Crumb = { label: string }

interface Props {
  /** Breadcrumb trail. The last item is rendered as the active page (foreground color). */
  crumbs: Crumb[]
  title: string
  subtitle?: string
  /** Slot for action buttons rendered to the right of the title block. */
  action?: React.ReactNode
}

/**
 * Page header with breadcrumb + title + subtitle, styled with `dashboard-header`.
 * Used by project sub-pages (api keys, settings) and any future detail pages
 * that need a consistent breadcrumb layout.
 */
export const ProjectBreadcrumbHeader: React.FC<Props> = ({ crumbs, title, subtitle, action }) => (
  <div className='dashboard-panel'>
    <div className='dashboard-header'>
      <div>
        <div className='flex items-center gap-2 text-[11.5px] font-semibold text-default-500'>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Icon icon='lucide:chevron-right' className='h-3 w-3' />}
              <span className={i === crumbs.length - 1 ? 'text-foreground' : ''}>{c.label}</span>
            </React.Fragment>
          ))}
        </div>
        <h1 className='dashboard-title mt-2'>{title}</h1>
        {subtitle && <p className='dashboard-subtitle mt-1'>{subtitle}</p>}
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </div>
  </div>
)
