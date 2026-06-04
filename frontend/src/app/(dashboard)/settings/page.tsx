'use client'

import React, { useEffect, useState } from 'react'
import { Button, Input, Avatar } from '@heroui/react'
import Icon from '@/components/icon'
import { useAuth } from '@/providers/AuthContext'
import { api } from '@/api/generated/main-service'
import { UpdateProfileRequest } from '@/api/generated/main-service/apiGenerated'

export default function SettingsPage() {
  const { user, refreshUser, changePassword } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
    }
  }, [user])

  const handleUpdateProfile = async () => {
    setLoading(true)
    setMsg({ type: '', text: '' })
    try {
      const data: UpdateProfileRequest = { firstName, lastName, profileImageUrl: null }
      await api.settings.profileUpdate(data)
      await refreshUser()
      setMsg({ type: 'success', text: 'Profile updated successfully' })
    } catch (error: any) {
      console.error('Update profile failed', error)
      setMsg({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    setPasswordLoading(true)
    setPasswordMsg({ type: '', text: '' })
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordMsg({ type: 'success', text: 'Password changed successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (error: any) {
      console.error('Change password failed', error)
      setPasswordMsg({ type: 'error', text: 'Failed to change password' })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className='dashboard-page mx-auto w-full max-w-2xl pb-20 pt-4'>
      <div className='dashboard-panel'>
        <div className='dashboard-header'>
          <div>
            <h1 className='dashboard-title'>Account Settings</h1>
            <p className='dashboard-subtitle'>Manage your profile and preferences</p>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className='dashboard-panel'>
        <div className='dashboard-header'>
          <h3 className='text-[13px] font-bold text-foreground'>Personal Information</h3>
          <p className='mt-0.5 text-[11.5px] text-default-500'>Update your personal details</p>
        </div>
        <div className='space-y-5 p-6'>
          <div className='flex items-center gap-4'>
            <Avatar
              src={user?.profileImageUrl || undefined}
              name={user?.firstName?.charAt(0) || 'U'}
              className='h-16 w-16 text-xl'
            />
            <Button variant='flat' size='sm' radius='md' className='h-8 px-4 text-[11.5px] font-bold'>
              Change Avatar
            </Button>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <Input label='First Name' value={firstName} onValueChange={setFirstName} variant='bordered' size='sm' />
            <Input label='Last Name' value={lastName} onValueChange={setLastName} variant='bordered' size='sm' />
          </div>

          <Input
            label='Email'
            value={user?.email || ''}
            isReadOnly
            variant='faded'
            size='sm'
            description='Email cannot be changed'
          />

          {msg.text && (
            <p className={`text-[11.5px] font-medium ${msg.type === 'error' ? 'text-danger' : 'text-success'}`}>
              {msg.text}
            </p>
          )}
        </div>
        <div className='border-t border-default-200/70 bg-content2/50 px-6 py-3 text-right dark:border-white/10'>
          <Button
            color='primary'
            size='sm'
            radius='md'
            className='h-8 px-4 text-[11.5px] font-bold'
            isLoading={loading}
            onPress={handleUpdateProfile}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Security */}
      <div className='dashboard-panel'>
        <div className='dashboard-header'>
          <h3 className='text-[13px] font-bold text-foreground'>Security</h3>
          <p className='mt-0.5 text-[11.5px] text-default-500'>Manage your password</p>
        </div>
        <div className='p-6'>
          {!showPasswordForm ? (
            <Button
              variant='bordered'
              size='sm'
              radius='md'
              className='h-8 px-4 text-[11.5px] font-bold'
              startContent={<Icon icon='lucide:lock' className='h-3.5 w-3.5' />}
              onPress={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          ) : (
            <div className='space-y-4'>
              <Input
                label='Current Password'
                type='password'
                value={currentPassword}
                onValueChange={setCurrentPassword}
                variant='bordered'
                size='sm'
              />
              <Input
                label='New Password'
                type='password'
                value={newPassword}
                onValueChange={setNewPassword}
                variant='bordered'
                size='sm'
              />
              <Input
                label='Confirm New Password'
                type='password'
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                variant='bordered'
                size='sm'
              />
              {passwordMsg.text && (
                <p className={`text-[11.5px] font-medium ${passwordMsg.type === 'error' ? 'text-danger' : 'text-success'}`}>
                  {passwordMsg.text}
                </p>
              )}
              <div className='flex gap-2'>
                <Button
                  color='primary'
                  size='sm'
                  radius='md'
                  className='h-8 px-4 text-[11.5px] font-bold'
                  isLoading={passwordLoading}
                  onPress={handleChangePassword}>
                  Update Password
                </Button>
                <Button
                  variant='light'
                  size='sm'
                  radius='md'
                  className='h-8 px-4 text-[11.5px] font-bold'
                  onPress={() => setShowPasswordForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
