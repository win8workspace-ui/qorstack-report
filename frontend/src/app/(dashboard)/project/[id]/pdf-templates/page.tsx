'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { Suspense } from 'react'

function PdfTemplatesRedirect() {
  const router = useRouter()
  const params = useParams()
  useEffect(() => {
    router.replace(`/project/${params.id}/templates`)
  }, [params.id, router])
  return null
}

export default function PdfTemplatesRedirectPage() {
  return (
    <Suspense>
      <PdfTemplatesRedirect />
    </Suspense>
  )
}
