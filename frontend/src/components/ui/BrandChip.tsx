import Icon from '@/components/icon'
import { cn } from '@heroui/react'
import React from 'react'

export type BrandChipTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
export type BrandChipSize = 'xs' | 'sm' | 'md'

interface BrandChipProps {
  children: React.ReactNode
  tone?: BrandChipTone
  size?: BrandChipSize
  icon?: string
  uppercase?: boolean
  mono?: boolean
  className?: string
}

const toneClasses: Record<BrandChipTone, string> = {
  primary:
    'bg-primary/15 text-primary-700 ring-primary/40 dark:bg-primary-400/25 dark:text-primary-100 dark:ring-primary-400/50',
  success:
    'bg-success/10 text-success-700 ring-success/25 dark:bg-success-400/15 dark:text-success-300 dark:ring-success-400/30',
  warning:
    'bg-warning/10 text-warning-700 ring-warning/25 dark:bg-warning-400/15 dark:text-warning-300 dark:ring-warning-400/30',
  danger:
    'bg-danger/10 text-danger-600 ring-danger/25 dark:bg-danger-400/15 dark:text-danger-300 dark:ring-danger-400/30',
  neutral: 'bg-default-100 text-default-700 ring-default-200 dark:bg-white/5 dark:text-default-300 dark:ring-white/10'
}

const sizeClasses: Record<BrandChipSize, string> = {
  xs: 'h-4 px-1.5 text-[9.5px] gap-1',
  sm: 'h-5 px-2 text-[10px] gap-1',
  md: 'h-6 px-2.5 text-[11px] gap-1.5'
}

const iconSize: Record<BrandChipSize, string> = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5'
}

export const BrandChip: React.FC<BrandChipProps> = ({
  children,
  tone = 'primary',
  size = 'sm',
  icon,
  uppercase = false,
  mono = false,
  className
}) => (
  <span
    className={cn(
      'inline-flex items-center whitespace-nowrap rounded-md font-semibold leading-none ring-1 ring-inset',
      toneClasses[tone],
      sizeClasses[size],
      uppercase && 'uppercase tracking-wider',
      mono && 'font-mono',
      className
    )}>
    {icon && <Icon icon={icon} className={cn('shrink-0', iconSize[size])} />}
    {children}
  </span>
)
