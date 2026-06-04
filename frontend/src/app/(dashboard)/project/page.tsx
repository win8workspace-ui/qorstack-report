'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/providers/ProjectContext'

export default function ProjectIndexPage() {
  const router = useRouter()
  const { projects, isLoading, hasFetched, fetchError } = useProject()

  useEffect(() => {
    if (isLoading || !hasFetched || fetchError) return
    if (projects.length > 0 && projects[0].id) {
      router.replace(`/project/${projects[0].id}`)
    } else {
      router.replace('/create-project')
    }
  }, [projects, isLoading, hasFetched, fetchError, router])

  return null
}
