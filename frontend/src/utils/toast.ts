import { addToast } from '@heroui/react'

/**
 * Standardized toast helpers — keeps wording and color consistent across pages.
 *
 * Use these instead of calling `addToast({ ... })` directly so success/error tone,
 * title casing, and icon usage stay in sync everywhere.
 */

type ToastInput = {
  title?: string
  description: string
}

export const toast = {
  success: ({ title = 'Success', description }: ToastInput) => addToast({ title, description, color: 'success' }),

  error: ({ title = 'Error', description }: ToastInput) => addToast({ title, description, color: 'danger' }),

  info: ({ title = 'Info', description }: ToastInput) => addToast({ title, description, color: 'primary' }),

  warning: ({ title = 'Warning', description }: ToastInput) => addToast({ title, description, color: 'warning' })
}

/**
 * Pre-formatted messages for common CRUD actions on resources.
 * Pass the resource label (e.g. "Template", "Font", "Project").
 *
 * Example:
 *   toast.success(MSG.deleted('Template'))
 *   toast.error(MSG.deleteFailed('Template'))
 */
export const MSG = {
  created: (resource: string) => ({ description: `${resource} created successfully` }),
  updated: (resource: string) => ({ description: `${resource} updated successfully` }),
  deleted: (resource: string) => ({ description: `${resource} deleted successfully` }),
  saved: (resource: string) => ({ description: `${resource} saved successfully` }),
  uploaded: (resource: string) => ({ description: `${resource} uploaded successfully` }),

  createFailed: (resource: string) => ({ description: `Failed to create ${resource.toLowerCase()}` }),
  updateFailed: (resource: string) => ({ description: `Failed to update ${resource.toLowerCase()}` }),
  deleteFailed: (resource: string) => ({ description: `Failed to delete ${resource.toLowerCase()}` }),
  saveFailed: (resource: string) => ({ description: `Failed to save ${resource.toLowerCase()}` }),
  uploadFailed: (resource: string) => ({ description: `Failed to upload ${resource.toLowerCase()}` })
}
