'use client'

import { HeroUIProvider as NextProvider, ToastProvider } from '@heroui/react'
import { useRouter } from 'next/navigation'

export default function HeroUIProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <NextProvider navigate={router.push}>
      <ToastProvider
        placement='top-right'
        toastProps={{
          variant: 'flat',
          radius: 'md',
          timeout: 4000,
          classNames: {
            base: 'min-w-[280px] max-w-[360px] border border-default-200 !bg-content1 backdrop-blur-md shadow-md',
            title: 'text-sm font-medium text-foreground',
            description: 'text-xs text-default-500',
            icon: 'w-4 h-4',
            closeButton: 'opacity-60 hover:opacity-100'
          }
        }}
      />
      {children}
    </NextProvider>
  )
}
