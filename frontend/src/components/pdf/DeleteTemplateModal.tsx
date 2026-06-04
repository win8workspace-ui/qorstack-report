import React from 'react'
import { addToast } from '@heroui/react'
import { api } from '@/api/generated/main-service'
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal'

interface DeleteTemplateModalProps {
  isOpen: boolean
  onClose?: () => void
  onSuccess?: () => void
  templateName: string
  templateKey: string
}

/**
 * Template-specific delete modal — uses the shared ConfirmDeleteModal with
 * type-to-confirm gating, then calls the template delete API.
 */
export const DeleteTemplateModal: React.FC<DeleteTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  templateName,
  templateKey
}) => {
  const handleDelete = async () => {
    try {
      await api.templates.templatesDelete(templateKey)
      addToast({ title: 'Success', description: 'Template deleted successfully', color: 'success' })
      onSuccess?.()
    } catch (error) {
      console.error('Failed to delete template', error)
      addToast({ title: 'Error', description: 'Failed to delete template', color: 'danger' })
      throw error
    }
  }

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      onClose={() => onClose?.()}
      onConfirm={handleDelete}
      title='Delete Template'
      resourceName={templateName}
    />
  )
}
