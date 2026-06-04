'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/generated/main-service'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Button, Input, Spinner, Skeleton, addToast, cn, Switch } from '@heroui/react'
import Icon from '@/components/icon'
import { TemplateVersionResponse } from '@/api/generated/main-service/apiGenerated'
import { ExcelUiState, ExcelTableItem } from '@/types/excel-sandbox'
import { DeleteTemplateModal } from '@/components/pdf/DeleteTemplateModal'
import {
  ReplacementsSection,
  ImagesSection,
  QrCodesSection,
  BarcodesSection,
  generateId,
  formatKey
} from '@/components/excel/ExcelSandboxInputs'
import { ExcelTablesSection } from '@/components/excel/ExcelSandboxInputs'
import type { ImageItem, QrCodeItem, BarcodeItem } from '@/components/pdf/SandboxInputs'
import { CodeSwitcher } from '@/components/docs/CodeSwitcher'
import { getSdkCodeExamples } from '@/utils/code-gen'
import type { CodeExamples } from '@/utils/code-gen'
import ExcelPreviewDrawer from '@/components/excel/ExcelPreviewDrawer'
import { handleApiError } from '@/hooks/useApiError'
import { downloadFileFromUrl } from '@/utils/download-file'
import { SegmentedTabs, CategoryNav } from '@/components/ui'
import dynamic from 'next/dynamic'
import { useUpgradeGate } from '@/hooks/use-upgrade-gate'
import { useLivePreview } from '@/hooks/use-live-preview'
import { useResizablePanel } from '@/hooks/use-resizable-panel'
import { TemplateHeaderPortals, UpdateFileModal } from '@/components/templates'

const PdfPreview = dynamic(() => import('@/components/pdf/PdfPreview'), {
  ssr: false,
  loading: () => (
    <div className='flex items-center gap-2 p-4'>
      <Spinner size='sm' color='primary' />
      <span className='text-sm text-default-500'>Loading Preview...</span>
    </div>
  )
})

const ExcelPreview = dynamic(() => import('@/components/excel/ExcelPreview'), {
  ssr: false,
  loading: () => <Skeleton className='h-full min-h-[500px] w-full rounded-lg' />
})

// --- Default State ---
const DEFAULT_UI_STATE: ExcelUiState = {
  templateKey: '',
  fileName: 'My_Generated_Report',
  zipOutput: false,
  replace: [],
  table: [],
  image: [],
  qrcode: [],
  barcode: []
}

// --- Converters ---
const convertToUiState = (data: Record<string, unknown>, templateKey: string): ExcelUiState => {
  const tableRaw = (data.table as Record<string, unknown>[] | undefined) || []
  return {
    templateKey,
    fileName: (data.fileName as string) || 'My_Generated_Report',
    zipOutput: (data.zipOutput as boolean) || false,
    replace: Object.entries((data.replace as Record<string, string>) || {}).map(([key, value]) => ({
      id: generateId(),
      key: formatKey(key, 'replace'),
      value: value === null || value === undefined ? '' : String(value)
    })),
    table: tableRaw.map(t => {
      const rows = ((t.rows as Record<string, unknown>[]) || []).map(row => {
        const newRow: Record<string, string> = {}
        Object.entries(row).forEach(([k, v]) => {
          newRow[`{{row:${k}}}`] = v === null || v === undefined ? '' : String(v)
        })
        return newRow
      })
      // Prefer explicitly-saved column order; fall back to first row's key order
      const savedCols = (t.columns as string[]) || []
      const columns =
        savedCols.length > 0 ? savedCols.map(k => `{{row:${k}}}`) : rows.length > 0 ? Object.keys(rows[0]) : []
      return {
        id: generateId(),
        columns,
        rows,
        sort: (t.sort as ExcelTableItem['sort']) || [],
        verticalMerge: (t.verticalMerge as string[]) || [],
        collapse: (t.collapse as string[]) || [],
        freezeHeader: (t.freezeHeader as boolean) ?? false,
        autoFilter: (t.autoFilter as boolean) ?? false,
        autoFitColumns: (t.autoFitColumns as boolean) ?? false,
        outline: (t.outline as boolean) ?? false,
        generateTotals: (t.generateTotals as Record<string, string>) || undefined,
        numberFormat: (t.numberFormat as Record<string, string>) || undefined,
        conditionalFormat: (t.conditionalFormat as ExcelTableItem['conditionalFormat']) || undefined,
        splitToSheets: (t.splitToSheets as ExcelTableItem['splitToSheets']) || undefined
      }
    }),
    image: Object.entries((data.image as Record<string, unknown>) || {}).map(([key, val]) => ({
      id: generateId(),
      key: formatKey(key, 'image'),
      data: val as ImageItem['data']
    })),
    qrcode: Object.entries((data.qrcode as Record<string, unknown>) || {}).map(([key, val]) => ({
      id: generateId(),
      key: formatKey(key, 'qrcode'),
      data: val as QrCodeItem['data']
    })),
    barcode: Object.entries((data.barcode as Record<string, unknown>) || {}).map(([key, val]) => ({
      id: generateId(),
      key: formatKey(key, 'barcode'),
      data: val as BarcodeItem['data']
    }))
  }
}

const stripKey = (key: string | null | undefined, type: 'replace' | 'table' | 'image' | 'qrcode' | 'barcode') => {
  if (key == null) return ''
  let k = String(key).replace(/^\{\{/, '').replace(/\}\}$/, '')
  if (type !== 'replace') {
    const prefix = `${type}:`
    if (k.startsWith(prefix)) return k.substring(prefix.length)
  }
  if (type === 'table') {
    if (k.startsWith('row:')) return k.substring('row:'.length)
    if (k.startsWith('col:')) return k.substring('col:'.length)
  }
  return k
}

const convertFromUiState = (state: ExcelUiState) => {
  const hasObjectValues = (value?: Record<string, unknown>) => !!value && Object.keys(value).length > 0

  return {
    templateKey: state.templateKey,
    fileName: state.fileName,
    zipOutput: state.zipOutput || false,
    replace: state.replace.reduce<Record<string, string>>(
      (acc, item) => ({ ...acc, [stripKey(item.key, 'replace')]: item.value }),
      {}
    ),
    table: state.table.map(item => {
      const rows = (item.rows || []).map(row => {
        const newRow: Record<string, unknown> = {}
        item.columns.forEach(colKey => {
          const cleanColKey = stripKey(colKey, 'table')
          newRow[cleanColKey] = row[colKey] || ''
        })
        return newRow
      })

      const tablePayload: Record<string, unknown> = {
        columns: item.columns.map(c => stripKey(c, 'table')),
        rows
      }

      if (item.sort?.length) tablePayload.sort = item.sort
      if (item.verticalMerge?.length) tablePayload.verticalMerge = item.verticalMerge
      if (item.collapse?.length) tablePayload.collapse = item.collapse
      if (item.freezeHeader) tablePayload.freezeHeader = true
      if (item.autoFilter) tablePayload.autoFilter = true
      if (item.autoFitColumns) tablePayload.autoFitColumns = true
      if (item.outline) tablePayload.outline = true
      if (hasObjectValues(item.generateTotals)) tablePayload.generateTotals = item.generateTotals
      if (hasObjectValues(item.numberFormat)) tablePayload.numberFormat = item.numberFormat
      if (item.conditionalFormat?.length) tablePayload.conditionalFormat = item.conditionalFormat
      if (item.splitToSheets?.field) tablePayload.splitToSheets = item.splitToSheets
      if (item.excelTableStyle) tablePayload.excelTableStyle = item.excelTableStyle

      return tablePayload
    }),
    image: state.image.reduce<Record<string, unknown>>(
      (acc, item) => ({ ...acc, [stripKey(item.key, 'image')]: item.data }),
      {}
    ),
    qrcode: state.qrcode.reduce<Record<string, unknown>>(
      (acc, item) => ({ ...acc, [stripKey(item.key, 'qrcode')]: item.data }),
      {}
    ),
    barcode: state.barcode.reduce<Record<string, unknown>>(
      (acc, item) => ({ ...acc, [stripKey(item.key, 'barcode')]: item.data }),
      {}
    )
  }
}

// --- Section Wrapper ---
const SectionWrapper = ({
  title,
  description,
  action,
  children
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) => (
  <div className='flex h-full w-full flex-col'>
    <div className='mb-3 flex items-start justify-between gap-3'>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <h2 className='text-[16px] font-bold leading-tight tracking-tight text-foreground'>{title}</h2>
        {description && <p className='text-[11.5px] font-normal leading-snug text-default-500'>{description}</p>}
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </div>
    <div className='pb-8'>{children}</div>
  </div>
)

// --- Main Page ---
const ExcelSandboxPage = () => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const templateKeyParam = params.id as string

  const [uiState, setUiState] = useState<ExcelUiState>(DEFAULT_UI_STATE)
  const [activeMainTab, setActiveMainTab] = useState<'builder' | 'code'>('builder')
  const [activeBuilderCategory, setActiveBuilderCategory] = useState<
    'text' | 'tables' | 'image' | 'qrcode' | 'barcode' | 'settings'
  >('text')

  const [isGenerating, setGenerating] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloadingSource, setIsDownloadingSource] = useState(false)

  const [previewFilePath, setPreviewFilePath] = useState<string | null>(null)
  const [sourceSheetPdfUrlMap, setSourceSheetPdfUrlMap] = useState<Record<string, string> | null>(null)
  const [isLoadingSourcePreview, setIsLoadingSourcePreview] = useState(false)
  const [activeSourceSheetName, setActiveSourceSheetName] = useState<string | null>(null)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [generatedPdfPreviewUrl, setGeneratedPdfPreviewUrl] = useState<string | null>(null)
  const [generatedSheetPageMap, setGeneratedSheetPageMap] = useState<Record<string, number> | null>(null)
  const [generatedSheetPdfUrlMap, setGeneratedSheetPdfUrlMap] = useState<Record<string, string> | null>(null)
  const [activeSheetName, setActiveSheetName] = useState<string | null>(null)
  const [generatedIsZip, setGeneratedIsZip] = useState(false)
  const [generatedZipUrl, setGeneratedZipUrl] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'before' | 'after'>('before')

  const [templateName, setTemplateName] = useState('')
  const [templateKey, setTemplateKey] = useState('')
  const [_lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [tempEditData, setTempEditData] = useState({ name: '', key: '' })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)

  const [isUpdateFileOpen, setIsUpdateFileOpen] = useState(false)

  const [versions, setVersions] = useState<TemplateVersionResponse[]>([])
  const [activeVersion, setActiveVersion] = useState<number | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [liveMode, setLiveMode] = useState(false)
  const { requireFeature, gateModal, isLoading: isFeaturesLoading, features } = useUpgradeGate()
  const { width: panelWidth, handleMouseDown: handlePanelResize } = useResizablePanel('builder-panel-width-excel', 640)
  const canUseLivePreview = !!features?.livePreview

  const handleLiveModeToggle = () => {
    if (!requireFeature('livePreview')) return
    setLiveMode(v => {
      const next = !v
      if (!next) setPreviewMode('before')
      return next
    })
  }

  const fetchTemplateDetails = useCallback(async (key: string) => {
    setIsLoading(true)
    setSourceSheetPdfUrlMap(null)
    try {
      const template = await api.templates.getTemplateById(key)
      setTemplateName(template.name || '')
      setTemplateKey(template.templateKey || '')
      setLastUpdated(template.updatedDatetime ?? template.createdDatetime ?? null)
      setPreviewFilePath(template.activeVersion?.previewFilePathPresigned || null)

      // Fetch sheet names for Source preview tab bar (used to seed active sheet name
      // while the per-sheet PDF render is loading, and as a fallback display).
      let loadedSheetMap: Record<string, number> | null = null
      try {
        const sheetMap = await api.templates.getTemplateSheets(key)
        if (sheetMap && Object.keys(sheetMap).length > 0) {
          loadedSheetMap = sheetMap
          setActiveSourceSheetName(Object.keys(sheetMap)[0])
        } else {
          setActiveSourceSheetName(null)
        }
      } catch {
        setActiveSourceSheetName(null)
      }

      if (template.fileSandboxLastTestPresigned) {
        setGeneratedUrl(template.fileSandboxLastTestPresigned)
      } else {
        setGeneratedUrl(null)
      }

      const pdfPreviewPresigned = template.activeVersion?.sandboxPdfPreviewPresigned ?? null
      setGeneratedPdfPreviewUrl(null) // only used as legacy fallback

      // Parse per-sheet PDF URL map from stored JSON
      let restoredSheetPdfUrlMap: Record<string, string> | null = null
      if (pdfPreviewPresigned) {
        try {
          const parsed = JSON.parse(pdfPreviewPresigned)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            restoredSheetPdfUrlMap = parsed as Record<string, string>
          }
        } catch {
          // legacy single URL — wrap as single-entry map using first sheet name
          if (loadedSheetMap) {
            const firstName = Object.keys(loadedSheetMap)[0]
            if (firstName) restoredSheetPdfUrlMap = { [firstName]: pdfPreviewPresigned }
          }
        }
      }
      setGeneratedSheetPdfUrlMap(restoredSheetPdfUrlMap)
      setGeneratedSheetPageMap(null)

      if (restoredSheetPdfUrlMap) {
        const firstSheet = Object.keys(restoredSheetPdfUrlMap)[0] ?? null
        setActiveSheetName(firstSheet)
      } else {
        setActiveSheetName(null)
      }
      setPreviewMode('before')

      if (template.allVersions && template.allVersions.length > 0) {
        setVersions(template.allVersions)
      } else if (template.activeVersion) {
        setVersions([template.activeVersion])
      }
      setActiveVersion(template.activeVersion?.version != null ? Number(template.activeVersion.version) : null)

      if (template.sandboxPayload) {
        try {
          const parsed = JSON.parse(template.sandboxPayload)
          setUiState(convertToUiState(parsed, template.templateKey || key))
        } catch {
          setUiState({ ...DEFAULT_UI_STATE, templateKey: template.templateKey || key })
        }
      } else {
        setUiState({ ...DEFAULT_UI_STATE, templateKey: template.templateKey || key })
      }
    } catch (err) {
      handleApiError(err, 'Failed to load template.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (templateKeyParam) {
      fetchTemplateDetails(templateKeyParam)
    }
  }, [templateKeyParam, fetchTemplateDetails])

  // Auto-render the template source with NO variable replacement so source preview
  // shows per-sheet PDFs (mirroring result preview UX). Triggered once per template/version.
  useEffect(() => {
    if (!templateKey || !activeVersion) return
    if (sourceSheetPdfUrlMap) return
    let cancelled = false
    setIsLoadingSourcePreview(true)
    ;(async () => {
      try {
        const res = await api.render.excelTemplateCreate({
          templateKey,
          fileName: 'source_preview',
          replace: {},
          table: []
        } as Parameters<typeof api.render.excelTemplateCreate>[0])
        if (cancelled) return
        if (res?.sheetPdfUrlMap && Object.keys(res.sheetPdfUrlMap).length > 0) {
          setSourceSheetPdfUrlMap(res.sheetPdfUrlMap)
        }
      } catch {
        // Silent fallback — keep single-PDF preview if render fails.
      } finally {
        if (!cancelled) setIsLoadingSourcePreview(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [templateKey, activeVersion, sourceSheetPdfUrlMap])

  useEffect(() => {
    if (isEditOpen) {
      setTempEditData({ name: templateName, key: templateKey })
    }
  }, [isEditOpen, templateName, templateKey])

  const getExampleCode = (): CodeExamples => {
    const payload = convertFromUiState(uiState)
    ;(payload as Record<string, unknown>).templateKey = templateKey
    return getSdkCodeExamples(payload, { documentType: 'excel' })
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const payload = convertFromUiState(uiState)
      ;(payload as Record<string, unknown>).templateKey = templateKey

      const res = await api.render.excelTemplateCreate(payload as Parameters<typeof api.render.excelTemplateCreate>[0])
      if (res?.downloadUrl) {
        const isZip = res.isZipped || res.fileType === 'zip'
        setPreviewMode('after')
        if (isZip) {
          setGeneratedIsZip(true)
          setGeneratedZipUrl(res.downloadUrl)
          setGeneratedUrl(null)
          setGeneratedPdfPreviewUrl(null)
          setGeneratedSheetPageMap(null)
        } else {
          setGeneratedIsZip(false)
          setGeneratedZipUrl(null)
          setGeneratedUrl(res.downloadUrl)
          setGeneratedPdfPreviewUrl(res.pdfPreviewUrl ?? null)
          const newPdfMap = res.sheetPdfUrlMap ?? null
          const newPageMap = res.sheetPageMap ?? null
          setGeneratedSheetPdfUrlMap(newPdfMap)
          setGeneratedSheetPageMap(newPageMap)
          const firstSheet = newPdfMap
            ? Object.keys(newPdfMap)[0]
            : newPageMap
              ? Object.keys(newPageMap)[0]
              : null
          setActiveSheetName(firstSheet ?? null)
        }
      }

      // The server already persists the sandbox payload (with base64→minio: conversion)
      // in ExportExcelCommandHandler. Do NOT save from frontend here — the frontend
      // payload still has raw base64 which would overwrite the server's clean version
      // and cause DB errors on next template update.
    } catch (err) {
      handleApiError(err, 'Generation failed. Please check your inputs.')
    } finally {
      setGenerating(false)
    }
  }

  const { isRendering: isLivePreviewRendering, error: livePreviewError } = useLivePreview({
    templateKey,
    uiState,
    enabled: liveMode && canUseLivePreview,
    isLoading,
    render: async (state, signal) => {
      const payload = convertFromUiState(state)
      ;(payload as Record<string, unknown>).templateKey = templateKey
      return api.render.excelTemplateCreate(payload as Parameters<typeof api.render.excelTemplateCreate>[0], {
        signal
      })
    },
    onRender: res => {
      setGeneratedUrl(res.downloadUrl)
      setGeneratedPdfPreviewUrl(res.pdfPreviewUrl ?? null)
      setGeneratedSheetPdfUrlMap(res.sheetPdfUrlMap ?? null)
      setGeneratedSheetPageMap(res.sheetPageMap ?? null)
      setPreviewMode('after')
    }
  })

  const handleSaveDetails = async () => {
    setIsSaving(true)
    try {
      const projectId = searchParams.get('projectId')
      const trimmedKey = tempEditData.key.trim()
      const keyChanged = !!trimmedKey && trimmedKey !== templateKey
      const effectiveKey = keyChanged ? trimmedKey : templateKey

      const payload = convertFromUiState(uiState)
      ;(payload as Record<string, unknown>).templateKey = effectiveKey

      // Strip base64 image data before sending — it's too large for URL query params.
      // The server already has the minio: URLs from the last render; only send
      // non-image payload fields (replace, table, fileName, etc.).
      const safePayload = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
      const stripBase64 = (obj: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string' && v.startsWith('data:')) obj[k] = null
          else if (v && typeof v === 'object' && !Array.isArray(v)) stripBase64(v as Record<string, unknown>)
        }
      }
      stripBase64(safePayload)

      await api.templates.templatesUpdate(
        templateKey,
        {
          name: tempEditData.name,
          newTemplateKey: keyChanged ? trimmedKey : undefined,
          sandboxPayload: JSON.stringify(safePayload),
          project_id: projectId ?? undefined,
          isAutoGeneratedVariable: false
        },
        {}
      )
      setTemplateName(tempEditData.name)
      setIsEditOpen(false)
      addToast({ title: 'Success', description: 'Template saved successfully', color: 'success' })

      if (keyChanged) {
        // The key is the route identifier — move to the new URL and reload from there.
        setTemplateKey(trimmedKey)
        const query = projectId ? `?projectId=${projectId}` : ''
        router.replace(`/excel/templates/${trimmedKey}${query}`)
      } else {
        fetchTemplateDetails(templateKey)
      }
    } catch (err) {
      handleApiError(err, 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const generateKey = async () => {
    setIsGeneratingKey(true)
    try {
      const key = await api.templates.templateGenerateKeyList()
      setTempEditData(prev => ({ ...prev, key }))
    } catch (err) {
      handleApiError(err, 'Failed to generate template key.')
    } finally {
      setIsGeneratingKey(false)
    }
  }

  const handleVersionChange = async (version: number) => {
    try {
      await api.templates.switchVersionUpdate(templateKey, { version })
      fetchTemplateDetails(templateKey)
    } catch (err) {
      handleApiError(err, 'Failed to switch version.')
    }
  }

  const handleUpdateFile = async (file: File) => {
    setIsSaving(true)
    try {
      const projectId = searchParams.get('projectId')
      // Do NOT send sandboxPayload when uploading a new file.
      // The server's UpdateTemplateCommandHandler reads the existing payload from DB
      // (which has clean minio: URLs) and syncs it with the new file's markers.
      // Sending the frontend payload here would include raw base64 image data
      // that's too large for URL query params and would overwrite the clean version.
      await api.templates.templatesUpdate(
        templateKey,
        {
          name: templateName,
          project_id: projectId ?? undefined,
          isAutoGeneratedVariable: true
        },
        { file }
      )
      addToast({ title: 'Success', description: 'Template file updated successfully', color: 'success' })
      setIsUpdateFileOpen(false)
      fetchTemplateDetails(templateKey)
    } catch (err) {
      handleApiError(err, 'Failed to update file.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-[calc(100vh-210px)] items-center justify-center bg-content1'>
        <Spinner size='lg' />
      </div>
    )
  }

  const previewSrc = previewMode === 'after' ? generatedUrl : previewFilePath
  const isResultPreview = previewMode === 'after' && (!!generatedUrl || !!generatedSheetPdfUrlMap || generatedIsZip)

  const handleDownloadSource = async () => {
    setIsDownloadingSource(true)
    try {
      const res = await api.templates.downloadTemplate(templateKey)
      if (res?.url) {
        await downloadFileFromUrl(res.url, `${templateName}_v${activeVersion || 'latest'}.xlsx`)
      } else {
        addToast({ title: 'Error', description: 'Download URL not found', color: 'danger' })
      }
    } catch (err) {
      handleApiError(err, 'Failed to download template.')
    } finally {
      setIsDownloadingSource(false)
    }
  }

  const handleDownloadResult = () => {
    const baseName = uiState.fileName || templateName || 'output'
    if (generatedIsZip && generatedZipUrl) {
      void downloadFileFromUrl(generatedZipUrl, `${baseName}.zip`)
    } else if (generatedUrl) {
      void downloadFileFromUrl(generatedUrl, `${baseName}.xlsx`)
    }
  }

  return (
    <div className='flex flex-1 flex-col font-sans text-foreground'>
      <DeleteTemplateModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          const projectId = searchParams.get('projectId')
          if (projectId) router.push(`/project/${projectId}/excel-templates`)
          else router.push('/')
        }}
        templateName={templateName}
        templateKey={templateKey}
      />

      <TemplateHeaderPortals
        templateType='excel'
        templateName={templateName}
        templateKey={templateKey}
        activeVersion={activeVersion}
        versions={versions}
        isDownloadingSource={isDownloadingSource}
        edit={{
          isOpen: isEditOpen,
          name: tempEditData.name,
          templateKey: tempEditData.key,
          isGeneratingKey,
          isSaving,
          onOpenChange: setIsEditOpen,
          onNameChange: v => setTempEditData(prev => ({ ...prev, name: v })),
          onKeyChange: v => setTempEditData(prev => ({ ...prev, key: v })),
          onGenerateKey: generateKey,
          onSave: handleSaveDetails
        }}
        onDelete={() => setIsDeleteModalOpen(true)}
        onDownloadSource={handleDownloadSource}
        onVersionChange={handleVersionChange}
        onUpdateFile={() => setIsUpdateFileOpen(true)}
      />

      {/* Main Content Area - Split Panel (mirrors PDF page) */}
      <div className='flex items-start'>
        {/* Left Panel: Builder */}
        <div
          className='builder-shell flex shrink-0 flex-col rounded-2xl'
          style={{ width: `${panelWidth}px` }}>
          <div className='px-4 pt-2 md:px-5'>
            <SegmentedTabs
              active={activeMainTab}
              onChange={setActiveMainTab}
              items={
                [
                  { id: 'builder', label: 'Builder UI', icon: 'lucide:layout' },
                  { id: 'code', label: 'Code', icon: 'lucide:code' }
                ] as const
              }
            />
          </div>

          {activeMainTab === 'builder' && (
            <div className='flex flex-col gap-3 px-4 pb-5 pt-1 md:flex-row md:px-5'>
              <CategoryNav
                className=''
                active={activeBuilderCategory}
                onChange={setActiveBuilderCategory}
                items={
                  [
                    { id: 'text', icon: 'lucide:type', label: 'Variables', count: uiState.replace.length },
                    { id: 'tables', icon: 'lucide:table', label: 'Tables', count: uiState.table.length },
                    { id: 'image', icon: 'lucide:image', label: 'Images', count: uiState.image.length },
                    { id: 'qrcode', icon: 'lucide:qr-code', label: 'QR Codes', count: uiState.qrcode.length },
                    { id: 'barcode', icon: 'lucide:barcode', label: 'Barcodes', count: uiState.barcode.length },
                    {
                      id: 'settings',
                      icon: 'lucide:settings',
                      label: 'File Settings',
                      section: 'config',
                      count: uiState.zipOutput ? 1 : 0
                    }
                  ] as const
                }
              />

              {/* Section content */}
              <div className='min-w-0 flex-1 p-1'>
                <>
                  {activeBuilderCategory === 'text' && (
                    <SectionWrapper
                      title='Text Replacements'
                      description='Define variables to replace in your template.'
                      action={
                        <Button
                          size='sm'
                          radius='md'
                          variant='flat'
                          className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                          onPress={() =>
                            setUiState(p => ({
                              ...p,
                              replace: [...p.replace, { id: generateId(), key: '', value: '' }]
                            }))
                          }
                          startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                          Add Variable
                        </Button>
                      }>
                      <ReplacementsSection
                        items={uiState.replace}
                        onChange={d => setUiState(p => ({ ...p, replace: d }))}
                      />
                    </SectionWrapper>
                  )}

                  {activeBuilderCategory === 'tables' && (
                    <SectionWrapper
                      title='Tables'
                      description='Manage tabular data with Excel-specific formatting options.'
                      action={
                        <Button
                          size='sm'
                          radius='md'
                          variant='flat'
                          className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                          onPress={() =>
                            setUiState(p => ({
                              ...p,
                              table: [...p.table, { id: generateId(), columns: [], rows: [] }]
                            }))
                          }
                          startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                          Add Table
                        </Button>
                      }>
                      <ExcelTablesSection items={uiState.table} onChange={d => setUiState(p => ({ ...p, table: d }))} />
                    </SectionWrapper>
                  )}

                  {activeBuilderCategory === 'image' && (
                    <SectionWrapper
                      title='Images'
                      description='Upload or link images.'
                      action={
                        <Button
                          size='sm'
                          radius='md'
                          variant='flat'
                          className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                          onPress={() =>
                            setUiState(p => ({
                              ...p,
                              image: [...p.image, { id: generateId(), key: '', data: { src: '', fit: 'cover' } }]
                            }))
                          }
                          startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                          Add Image
                        </Button>
                      }>
                      <ImagesSection items={uiState.image} onChange={d => setUiState(p => ({ ...p, image: d }))} />
                    </SectionWrapper>
                  )}

                  {activeBuilderCategory === 'qrcode' && (
                    <SectionWrapper
                      title='QR Codes'
                      description='Generate QR codes from text.'
                      action={
                        <Button
                          size='sm'
                          radius='md'
                          variant='flat'
                          className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                          onPress={() =>
                            setUiState(p => ({
                              ...p,
                              qrcode: [...p.qrcode, { id: generateId(), key: '', data: { text: '' } }]
                            }))
                          }
                          startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                          Add QR
                        </Button>
                      }>
                      <QrCodesSection items={uiState.qrcode} onChange={d => setUiState(p => ({ ...p, qrcode: d }))} />
                    </SectionWrapper>
                  )}

                  {activeBuilderCategory === 'barcode' && (
                    <SectionWrapper
                      title='Barcodes'
                      description='Generate barcodes.'
                      action={
                        <Button
                          size='sm'
                          radius='md'
                          variant='flat'
                          className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                          onPress={() =>
                            setUiState(p => ({
                              ...p,
                              barcode: [
                                ...p.barcode,
                                {
                                  id: generateId(),
                                  key: '',
                                  data: { text: '', format: 'Code128', width: 200, height: 50, includeText: true }
                                }
                              ]
                            }))
                          }
                          startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                          Add Barcode
                        </Button>
                      }>
                      <BarcodesSection
                        items={uiState.barcode}
                        onChange={d => setUiState(p => ({ ...p, barcode: d }))}
                      />
                    </SectionWrapper>
                  )}

                  {activeBuilderCategory === 'settings' && (
                    <SectionWrapper
                      title='File Settings'
                      description='Configure output file name and download options.'>
                      <div className='flex flex-col gap-5'>
                        {/* File Name */}
                        <div className='flex flex-col gap-1.5'>
                          <label className='text-sm font-semibold text-foreground'>Output File Name</label>
                          <Input
                            value={uiState.fileName || ''}
                            onValueChange={v => setUiState(p => ({ ...p, fileName: v }))}
                            placeholder='My_Generated_Report'
                            size='sm'
                            variant='bordered'
                            classNames={{ inputWrapper: 'bg-content1 shadow-none border-1' }}
                            endContent={<span className='text-xs text-default-400'>.xlsx</span>}
                            startContent={<Icon icon='lucide:file-spreadsheet' className='h-4 w-4 text-default-400' />}
                          />
                          <p className='text-xs text-default-400'>The file name for the generated Excel output.</p>
                        </div>

                        {/* ZIP Output */}
                        <div className='ring-hairline flex items-center justify-between rounded-lg bg-content2 p-3'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-default-100'>
                              <Icon icon='lucide:archive' className='h-4 w-4 text-default-600' />
                            </div>
                            <div>
                              <p className='text-sm font-semibold text-foreground'>Download as ZIP</p>
                              <p className='text-xs text-default-500'>Wrap the .xlsx file in a .zip archive</p>
                            </div>
                          </div>
                          <Switch
                            isSelected={!!uiState.zipOutput}
                            onValueChange={v => {
                              if (v && !requireFeature('downloadAsZip')) return
                              setUiState(p => ({ ...p, zipOutput: v }))
                            }}
                            size='sm'
                          />
                        </div>
                      </div>
                    </SectionWrapper>
                  )}
                </>
              </div>
            </div>
          )}

          {activeMainTab === 'code' && (
            <div className='p-3 md:p-4'>
              <CodeSwitcher
                examples={getExampleCode()}
                title='Code'
                defaultLanguage='api'
                isDisableMarginY={true}
              />
            </div>
          )}
        </div>

        {/* Drag Handle */}
        <div
          onMouseDown={handlePanelResize}
          className='group hidden cursor-col-resize items-center justify-center px-1 lg:flex'
          style={{ height: 'calc(100vh - 110px)', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          <div className='h-10 w-1 rounded-full bg-default-200 transition-colors group-hover:bg-default-400 group-active:bg-primary' />
        </div>

        {/* Right Panel: Preview */}
        <div className='builder-shell sticky top-0 hidden h-[calc(100vh-110px)] w-full flex-1 flex-col overflow-hidden rounded-2xl bg-content1 lg:flex'>
          <div className='flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-default-200/70 px-4 py-2.5 dark:border-white/10'>
            <div className='flex items-center gap-2'>
              <Icon icon='lucide:file-spreadsheet' className='h-4 w-4 text-default-500' />
              <span className='text-[13px] font-bold tracking-tight text-foreground'>Preview</span>
            </div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
              <div className='flex rounded-md bg-content2 p-0.5'>
                <button
                  type='button'
                  onClick={() => setPreviewMode('before')}
                  className={cn(
                    'rounded px-2 py-1 text-[11px] font-semibold transition-colors',
                    previewMode === 'before'
                      ? 'bg-content1 text-foreground shadow-sm'
                      : 'text-default-500 hover:text-foreground'
                  )}>
                  Source
                </button>
                <button
                  type='button'
                  onClick={() => setPreviewMode('after')}
                  className={cn(
                    'rounded px-2 py-1 text-[11px] font-semibold transition-colors',
                    previewMode === 'after'
                      ? 'bg-content1 text-foreground shadow-sm'
                      : 'text-default-500 hover:text-foreground'
                  )}>
                  Result
                </button>
              </div>
              <div className='h-5 w-px bg-default-200/80' />
              <label
                className='flex cursor-pointer select-none items-center gap-2'
                title='Re-render the preview as you edit variable values'>
                <span className='text-[11.5px] font-semibold text-default-600'>Live Preview</span>
                <button
                  type='button'
                  onClick={handleLiveModeToggle}
                  disabled={isFeaturesLoading}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 items-center rounded-md transition-colors duration-200',
                    liveMode ? 'bg-primary' : 'bg-content2 hover:bg-content3',
                    isFeaturesLoading && 'cursor-not-allowed opacity-60'
                  )}
                  aria-label='Toggle live preview'>
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-[4px] bg-white shadow transition-transform duration-200',
                      liveMode ? 'translate-x-[18px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </label>
              <div className='h-5 w-px bg-default-200/80' />
              <Button
                color='primary'
                size='sm'
                radius='md'
                className='h-8 px-3 text-[11.5px] font-bold'
                isLoading={isGenerating}
                onPress={handleGenerate}
                startContent={!isGenerating && <Icon icon='lucide:zap' className='h-3.5 w-3.5' />}>
                Generate Excel
              </Button>
            </div>
          </div>

          <div className='no-scrollbar flex min-h-0 flex-1 flex-col items-center overflow-y-auto bg-content2/35 p-4'>
            <div className='w-full max-w-4xl'>
            {/* Result tab */}
            {previewMode === 'after' ? (
              generatedIsZip && generatedZipUrl ? (
                /* ZIP download card */
                <div className='flex w-full flex-col items-center justify-center gap-6 py-16'>
                  <div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-content2'>
                    <Icon icon='lucide:archive' className='h-10 w-10 text-default-500' />
                  </div>
                  <div className='text-center'>
                    <p className='text-sm font-semibold text-foreground'>ZIP file generated</p>
                    <p className='mt-1 text-xs text-default-400'>ZIP files cannot be previewed. Download to view.</p>
                  </div>
                  <Button
                    color='primary'
                    size='sm'
                    radius='md'
                    startContent={<Icon icon='lucide:download' className='h-3.5 w-3.5' />}
                    onPress={() => {
                      void downloadFileFromUrl(generatedZipUrl, `${uiState.fileName || 'output'}.zip`)
                    }}>
                    Download ZIP
                  </Button>
                </div>
              ) : generatedUrl || generatedSheetPdfUrlMap ? (
                /* Excel result preview */
                <div className='w-full transition-all duration-300'>
                  <div className='mb-3 flex items-center gap-2 rounded-md bg-content2/70 px-3 py-2 text-[10.5px] text-default-600 ring-1 ring-default-200/70 dark:ring-white/10'>
                    {liveMode && isLivePreviewRendering ? (
                      <Spinner size='sm' color='primary' />
                    ) : (
                      <Icon
                        icon={liveMode && livePreviewError ? 'lucide:triangle-alert' : 'lucide:check-circle-2'}
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          liveMode && livePreviewError ? 'text-danger' : 'text-primary'
                        )}
                      />
                    )}
                    <span>
                      {liveMode
                        ? livePreviewError
                          ? livePreviewError
                          : isLivePreviewRendering
                            ? 'Updating live preview...'
                            : 'Live preview is showing the latest generated Excel output.'
                        : 'Result preview is showing the generated Excel output.'}
                    </span>
                  </div>
                  {liveMode && isLivePreviewRendering && !generatedUrl ? (
                    <Skeleton className='h-full min-h-[500px] w-full rounded-lg' />
                  ) : generatedSheetPdfUrlMap ? (
                    /* Per-sheet PDF mode: each tab shows its own PDF */
                    <div className='flex flex-col overflow-hidden rounded-lg ring-1 ring-default-200/70'>
                      {Object.keys(generatedSheetPdfUrlMap).length > 1 && (
                        <div className='no-scrollbar flex gap-1 overflow-x-auto border-b border-default-200 bg-background px-3 pt-2'>
                          {Object.keys(generatedSheetPdfUrlMap).map(name => (
                            <button
                              key={name}
                              onClick={() => setActiveSheetName(name)}
                              className={cn(
                                'flex shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors',
                                activeSheetName === name
                                  ? 'border-default-200 bg-background text-foreground'
                                  : 'border-transparent bg-content2 text-default-500 hover:text-default-700'
                              )}>
                              <Icon icon='lucide:table-2' className='h-3 w-3' />
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                      <PdfPreview
                        key={`${activeSheetName ?? 'default'}-${generatedSheetPdfUrlMap[activeSheetName ?? ''] ?? ''}`}
                        file={generatedSheetPdfUrlMap[activeSheetName ?? ''] ?? generatedSheetPdfUrlMap[Object.keys(generatedSheetPdfUrlMap)[0]]}
                        fileName={`${uiState.fileName || templateName || 'output'}_preview.pdf`}
                        loading={<Skeleton className='h-full min-h-[500px] w-full' />}
                        className='flex flex-col gap-4'
                        noBorder
                        minimal
                        initialPage={0}
                        onDownloadResult={handleDownloadResult}
                      />
                    </div>
                  ) : generatedPdfPreviewUrl ? (
                    /* Legacy single-PDF mode */
                    <div className='flex flex-col overflow-hidden rounded-lg ring-1 ring-default-200/70'>
                      {generatedSheetPageMap && Object.keys(generatedSheetPageMap).length > 1 && (
                        <div className='no-scrollbar flex gap-1 overflow-x-auto border-b border-default-200 bg-background px-3 pt-2'>
                          {Object.keys(generatedSheetPageMap).map(name => (
                            <button
                              key={name}
                              onClick={() => setActiveSheetName(name)}
                              className={cn(
                                'flex shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors',
                                activeSheetName === name
                                  ? 'border-default-200 bg-background text-foreground'
                                  : 'border-transparent bg-content2 text-default-500 hover:text-default-700'
                              )}>
                              <Icon icon='lucide:table-2' className='h-3 w-3' />
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                      <PdfPreview
                        key={`${generatedPdfPreviewUrl}-${activeSheetName ?? ''}`}
                        file={generatedPdfPreviewUrl}
                        fileName={`${uiState.fileName || templateName || 'output'}_preview.pdf`}
                        loading={<Skeleton className='h-full min-h-[500px] w-full' />}
                        className='flex flex-col gap-4'
                        noBorder
                        minimal
                        initialPage={
                          activeSheetName && generatedSheetPageMap
                            ? (generatedSheetPageMap[activeSheetName] ?? 1) - 1
                            : 0
                        }
                        pageRange={(() => {
                          if (!generatedSheetPageMap || !activeSheetName) return undefined
                          const sorted = Object.entries(generatedSheetPageMap).sort((a, b) => a[1] - b[1])
                          const idx = sorted.findIndex(([n]) => n === activeSheetName)
                          if (idx === -1) return undefined
                          const start = sorted[idx][1]
                          const end = idx + 1 < sorted.length ? sorted[idx + 1][1] - 1 : 9999
                          return [start, end] as [number, number]
                        })()}
                        onDownloadResult={handleDownloadResult}
                      />
                    </div>
                  ) : (
                    <div className='relative h-[calc(100vh-270px)] min-h-[500px] overflow-hidden rounded-lg bg-content1 ring-1 ring-default-200/70'>
                      <button
                        onClick={() => setIsExpanded(true)}
                        className='absolute right-2 top-2 z-10 rounded-md bg-content2/80 p-1.5 text-default-600 backdrop-blur transition-all duration-200 hover:bg-content3 hover:text-foreground'
                        title='Full Screen'>
                        <Icon icon='lucide:maximize-2' className='h-3.5 w-3.5' />
                      </button>
                      <ExcelPreview
                        url={generatedUrl}
                        fileName={`${uiState.fileName || templateName || 'output'}.xlsx`}
                        mode='result'
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Result empty state */
                <div className='flex min-h-[280px] w-full flex-col items-center justify-center p-8 text-center'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-content2'>
                    <Icon icon='lucide:zap' className='h-8 w-8 text-default-400' />
                  </div>
                  <h3 className='font-semibold text-foreground'>No result yet</h3>
                  <p className='max-w-xs text-xs text-default-400'>
                    Press Generate Excel to render and preview the output here.
                  </p>
                </div>
              )
            ) : /* Source tab */ previewSrc ? (
              <div className='w-full transition-all duration-300'>
                <div className='mb-3 flex items-center gap-2 rounded-md bg-content2/70 px-3 py-2 text-[10.5px] text-default-600 ring-1 ring-default-200/70 dark:ring-white/10'>
                  {liveMode && isLivePreviewRendering ? (
                    <Spinner size='sm' color='primary' />
                  ) : (
                    <Icon
                      icon={liveMode && livePreviewError ? 'lucide:triangle-alert' : 'lucide:info'}
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        liveMode && livePreviewError ? 'text-danger' : 'text-default-500'
                      )}
                    />
                  )}
                  <span>
                    {liveMode
                      ? livePreviewError
                        ? livePreviewError
                        : isLivePreviewRendering
                          ? 'Updating live preview...'
                          : 'Live preview is ready. Edit builder values to render the output.'
                      : 'Source preview. Generate Excel to inspect the rendered output file.'}
                  </span>
                </div>
                {/* Per-sheet PDF mode: same UX as Result preview, one PDF per sheet */}
                {sourceSheetPdfUrlMap && Object.keys(sourceSheetPdfUrlMap).length > 0 ? (
                  <div className='flex flex-col overflow-hidden rounded-lg ring-1 ring-default-200/70'>
                    {Object.keys(sourceSheetPdfUrlMap).length > 1 && (
                      <div className='no-scrollbar flex gap-1 overflow-x-auto border-b border-default-200 bg-background px-3 pt-2'>
                        {Object.keys(sourceSheetPdfUrlMap).map(name => (
                          <button
                            key={name}
                            onClick={() => setActiveSourceSheetName(name)}
                            className={cn(
                              'flex shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors',
                              activeSourceSheetName === name
                                ? 'border-default-200 bg-background text-foreground'
                                : 'border-transparent bg-content2 text-default-500 hover:text-default-700'
                            )}>
                            <Icon icon='lucide:table-2' className='h-3 w-3' />
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                    <PdfPreview
                      key={`src-${activeSourceSheetName ?? ''}-${sourceSheetPdfUrlMap[activeSourceSheetName ?? ''] ?? ''}`}
                      file={
                        sourceSheetPdfUrlMap[activeSourceSheetName ?? ''] ??
                        sourceSheetPdfUrlMap[Object.keys(sourceSheetPdfUrlMap)[0]]
                      }
                      fileName={`${templateName}_template_v${activeVersion ?? 'latest'}.pdf`}
                      loading={<Skeleton className='h-full min-h-[500px] w-full' />}
                      className='flex flex-col gap-4'
                      noBorder
                      minimal
                      onDownloadResult={() => { void handleDownloadSource() }}
                    />
                  </div>
                ) : isLoadingSourcePreview ? (
                  <Skeleton className='h-full min-h-[500px] w-full rounded-lg' />
                ) : (
                  <PdfPreview
                    file={previewFilePath ?? ''}
                    fileName={`${templateName}_template_v${activeVersion ?? 'latest'}.pdf`}
                    loading={<Skeleton className='h-full min-h-[500px] w-full' />}
                    className='flex flex-col gap-4'
                    noBorder
                    minimal
                    onDownloadResult={() => { void handleDownloadSource() }}
                  />
                )}
              </div>
            ) : (
              <div className='flex min-h-[280px] w-full flex-col items-center justify-center p-8 text-center'>
                <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-content2'>
                  <Icon icon='lucide:file-spreadsheet' className='h-8 w-8 text-default-500' />
                </div>
                <h3 className='font-semibold text-foreground'>No Preview Available</h3>
                <p className='max-w-xs text-xs text-default-400'>
                  Re-upload the template file to regenerate the preview.
                </p>
              </div>
            )}
            </div>
          </div>

          <ExcelPreviewDrawer
            isOpen={isExpanded}
            onClose={() => setIsExpanded(false)}
            file={
              isResultPreview && generatedSheetPdfUrlMap
                ? (generatedSheetPdfUrlMap[activeSheetName ?? ''] ?? generatedSheetPdfUrlMap[Object.keys(generatedSheetPdfUrlMap)[0]])
                : isResultPreview && generatedPdfPreviewUrl
                  ? generatedPdfPreviewUrl
                  : (previewSrc ?? '')
            }
            fileName={
              isResultPreview
                ? `${uiState.fileName || templateName || 'output'}${generatedSheetPdfUrlMap || generatedPdfPreviewUrl ? '_preview.pdf' : '.xlsx'}`
                : `${templateName}_template_v${activeVersion ?? 'latest'}.pdf`
            }
            format={isResultPreview && !generatedSheetPdfUrlMap && !generatedPdfPreviewUrl ? 'xlsx' : 'pdf'}
            mode={isResultPreview ? 'result' : 'template'}
          />
        </div>
      </div>

      <UpdateFileModal
        isOpen={isUpdateFileOpen}
        onOpenChange={setIsUpdateFileOpen}
        templateType='excel'
        isSaving={isSaving}
        onSubmit={handleUpdateFile}
      />

      {gateModal}
    </div>
  )
}

import { Suspense } from 'react'

export default function ExcelSandboxPageWrapper() {
  return (
    <Suspense>
      <ExcelSandboxPage />
    </Suspense>
  )
}
