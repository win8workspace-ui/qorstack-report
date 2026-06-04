'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import {
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip
} from '@heroui/react'
import Icon from '@/components/icon'
import { useAuth } from '@/providers/AuthContext'
import { api } from '@/api/generated/main-service'
import { ApiKeyDto } from '@/api/generated/main-service/apiGenerated'
import { format } from 'date-fns'

export default function ApiKeysPage() {
  const { user } = useAuth()
  const [keys, setKeys] = useState<ApiKeyDto[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
  const { copied, copy } = useCopyToClipboard()

  const fetchKeys = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await api.users.apiKeysDetail(user.id)
      setKeys(res || [])
    } catch (error) {
      console.error('Failed to fetch API keys', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCopy = (text: string) => {
    if (!text) return
    void copy(text)
  }

  const handleDelete = async (keyId: string) => {
    if (!keyId) return
    try {
      await api.apiKeys.apiKeysDelete(keyId)
      await fetchKeys()
    } catch (error) {
      console.error('Failed to revoke API key', error)
    }
  }

  const maskKey = (value?: string) => {
    if (!value) return '************************'
    return `${value.substring(0, 8)}${'•'.repeat(Math.max(value.length - 8, 12))}`
  }

  return (
    <div className='dashboard-page'>
      {/* Header */}
      <div className='dashboard-panel'>
        <div className='dashboard-header'>
        <div>
          <h1 className='dashboard-title'>API Keys</h1>
          <p className='dashboard-subtitle'>Manage your secret keys for API authentication.</p>
        </div>
        </div>
      </div>

      {/* Warning Card */}
      <div className='dashboard-soft border-l-4 border-warning p-4'>
        <div className='flex items-start gap-4'>
          <Icon icon='lucide:alert-triangle' className='mt-1 h-5 w-5 text-warning-600' />
          <div>
            <h3 className='font-bold text-foreground'>Security Notice</h3>
            <p className='text-sm text-default-600'>
              Your secret API keys can be used to perform any action on your behalf. Keep them secure and never share
              them in client-side code (browsers, apps).
            </p>
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div className='dashboard-panel'>
        <Table aria-label='API keys table' shadow='none' removeWrapper>
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>API KEY</TableColumn>
            <TableColumn>CREATED</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent={'No API keys found.'} isLoading={loading}>
            {keys.map(key => (
              <TableRow key={key.id} className='border-b border-default-200/50 last:border-none hover:bg-content2'>
                <TableCell>
                  <div className='font-bold text-foreground'>{key.name || 'Untitled Key'}</div>
                  <div className='text-xs text-default-400'>{key.id}</div>
                </TableCell>
                <TableCell>
                  <code className='rounded bg-content3 px-2 py-1 text-xs'>
                    {visibleKeys[key.id] ? key.xApiKey : maskKey(key.xApiKey)}
                  </code>
                </TableCell>
                <TableCell>
                  {key.createdDatetime ? format(new Date(key.createdDatetime), 'MMM dd, yyyy') : '-'}
                </TableCell>
                <TableCell>
                  <Chip size='sm' color={key.isActive ? 'success' : 'danger'} variant='flat' className='rounded-sm'>
                    {key.isActive ? 'Active' : 'Inactive'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Tooltip content={visibleKeys[key.id] ? 'Hide key' : 'Show key'}>
                      <button
                        onClick={() => setVisibleKeys(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                        className='text-default-400 hover:text-foreground'>
                        <Icon icon={visibleKeys[key.id] ? 'lucide:eye-off' : 'lucide:eye'} className='h-4 w-4' />
                      </button>
                    </Tooltip>
                    <Tooltip content={copied ? 'Copied' : 'Copy API key'}>
                      <button onClick={() => handleCopy(key.xApiKey || '')} className='text-default-400 hover:text-foreground'>
                        <Icon icon='lucide:copy' className='h-4 w-4' />
                      </button>
                    </Tooltip>
                    <Tooltip content='Revoke Key' color='danger'>
                      <button onClick={() => handleDelete(key.id || '')} className='text-default-400 hover:text-danger'>
                        <Icon icon='lucide:trash-2' className='h-4 w-4' />
                      </button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
