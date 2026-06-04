'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/api/generated/main-service'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Button,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  addToast,
  cn
} from '@heroui/react'
import Icon from '@/components/icon'
import {
  TemplateVersionResponse,
  PdfWatermarkRequest,
  PdfPasswordRequest,
  FontSummaryDto
} from '@/api/generated/main-service/apiGenerated'
import { PdfFromTemplateRequest } from '@/types/pdf-sandbox'
import { DeleteTemplateModal } from '@/components/pdf/DeleteTemplateModal'
import { useUpgradeGate } from '@/hooks/use-upgrade-gate'
import { useLivePreview } from '@/hooks/use-live-preview'
import { useResizablePanel } from '@/hooks/use-resizable-panel'
import { TemplateHeaderPortals, UpdateFileModal } from '@/components/templates'

import {
  ReplacementsSection,
  TablesSection,
  ImagesSection,
  QrCodesSection,
  BarcodesSection,
  FileSettingsSection,
  ReplaceItem,
  TableItem,
  ImageItem,
  QrCodeItem,
  BarcodeItem,
  generateId,
  formatKey
} from '@/components/pdf/SandboxInputs'
import { CodeSwitcher } from '@/components/docs/CodeSwitcher'
import {
  VariablesContent,
  TablesContent,
  ImagesContent,
  QrCodesContent,
  BarcodesContent,
  FileSettingsContent
} from '@/components/docs/DocContents'
import { SectionHeader, KeyBadge, SegmentedTabs, CategoryNav } from '@/components/ui'
import { getSdkCodeExamples } from '@/utils/code-gen'
import type { CodeExamples } from '@/utils/code-gen'
import PdfPreviewDrawer from '@/components/pdf/PdfPreviewDrawer'
import { handleApiError } from '@/hooks/useApiError'
import { downloadFileFromUrl } from '@/utils/download-file'

// --- Dynamic Components ---
const PdfPreview = dynamic(() => import('@/components/pdf/PdfPreview'), {
  ssr: false,
  loading: () => (
    <div className='flex items-center gap-2 p-4'>
      <Spinner size='sm' color='primary' />
      <span className='text-sm text-default-500'>Initializing Preview...</span>
    </div>
  )
})

// --- UI State Interface (Arrays for Ordering) ---
interface UiState {
  templateKey: string
  fileName: string
  pdfPassword?: PdfPasswordRequest
  watermark?: PdfWatermarkRequest
  zipOutput?: boolean
  replace: ReplaceItem[]
  table: TableItem[]
  image: ImageItem[]
  qrcode: QrCodeItem[]
  barcode: BarcodeItem[]
}

const DEFAULT_UI_STATE: UiState = {
  templateKey: '',
  fileName: 'My_Generated_Report',
  pdfPassword: undefined,
  watermark: undefined,
  zipOutput: false,
  replace: [],
  table: [],
  image: [],
  qrcode: [],
  barcode: []
}

// --- Converters ---
// Image watermarks are deprecated — UI supports text-only.
// Strip legacy fields (type/imageSrc/width/height) so stale data from old sandbox payloads
// or cached types doesn't end up in the request.
const sanitizeWatermark = (w: PdfWatermarkRequest | undefined): PdfWatermarkRequest | undefined => {
  if (!w) return undefined
  const legacy = w as PdfWatermarkRequest & { type?: string; imageSrc?: string; width?: number; height?: number }
  const { type: _t, imageSrc: _i, width: _w, height: _h, ...rest } = legacy
  return rest as PdfWatermarkRequest
}

const convertToUiState = (data: PdfFromTemplateRequest): UiState => {
  return {
    templateKey: data.templateKey || '',
    fileName: data.fileName || 'My_Generated_Report',
    pdfPassword: data.pdfPassword || undefined,
    watermark: sanitizeWatermark(data.watermark),
    zipOutput: (data as PdfFromTemplateRequest & { zipOutput?: boolean }).zipOutput || false,
    replace: Object.entries(data.replace || {}).map(([key, value]) => ({
      id: generateId(),
      key: formatKey(key, 'replace'),
      value: value === null || value === undefined || value === 'null' ? '' : String(value)
    })),
    table: (data.table || []).map(t => ({
      id: generateId(),
      columns: t.rows && t.rows.length > 0 ? Object.keys(t.rows[0]) : [],
      rows: (t.rows || []).map(row => {
        const newRow: Record<string, string> = {}
        Object.entries(row as Record<string, unknown>).forEach(([k, v]) => {
          newRow[k] = v === null || v === undefined || v === 'null' ? '' : String(v)
        })
        return newRow
      }),
      sort: t.sort || [],
      verticalMerge: (t.verticalMerge as string[] | undefined) || [],
      collapse: (t.collapse as string[] | undefined) || [],
      repeatHeader: t.repeatHeader ?? false
    })),
    image: Object.entries(data.image || {}).map(([key, val]) => ({
      id: generateId(),
      key: formatKey(key, 'image'),
      data: val
    })),
    qrcode: Object.entries(data.qrcode || {}).map(([key, val]) => ({
      id: generateId(),
      key: formatKey(key, 'qrcode'),
      data: val
    })),
    barcode: Object.entries(data.barcode || {}).map(([key, val]) => ({
      id: generateId(),
      key: formatKey(key, 'barcode'),
      data: val
    }))
  }
}

const convertFromUiState = (state: UiState): PdfFromTemplateRequest => {
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

  return {
    templateKey: state.templateKey,
    fileName: state.fileName,
    pdfPassword: state.pdfPassword || undefined,
    watermark: sanitizeWatermark(state.watermark),
    zipOutput: state.zipOutput || false,
    replace: state.replace.reduce((acc, item) => ({ ...acc, [stripKey(item.key, 'replace')]: item.value }), {}),
    table: state.table.map(item => {
      const rows = (item.rows || []).map(row => {
        const newRow: Record<string, unknown> = {}
        item.columns.forEach(colKey => {
          const cleanColKey = stripKey(colKey, 'table')
          newRow[cleanColKey] = row[colKey] || ''
        })
        return newRow
      })

      return {
        rows,
        sort: item.sort || [],
        verticalMerge: item.verticalMerge,
        collapse: item.collapse,
        repeatHeader: item.repeatHeader ?? false
      }
    }),
    image: state.image.reduce((acc, item) => ({ ...acc, [stripKey(item.key, 'image')]: item.data }), {}),
    qrcode: state.qrcode.reduce((acc, item) => ({ ...acc, [stripKey(item.key, 'qrcode')]: item.data }), {}),
    barcode: state.barcode.reduce((acc, item) => ({ ...acc, [stripKey(item.key, 'barcode')]: item.data }), {})
  }
}

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

const TemplateSandboxPage = () => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const templateKeyParam = params.id as string

  const [uiState, setUiState] = useState<UiState>(DEFAULT_UI_STATE)
  const [activeMainTab, setActiveMainTab] = useState<'builder' | 'code'>('builder')
  const [activeBuilderCategory, setActiveBuilderCategory] = useState<
    'text' | 'tables' | 'image' | 'qrcode' | 'barcode' | 'settings'
  >('text')

  const [isGenerating, setGenerating] = useState(false)
  const [isGeneratingWord, setIsGeneratingWord] = useState(false)
  const [generateFormat, setGenerateFormat] = useState<'pdf' | 'word'>('pdf')
  const [isDownloadingProtected, setIsDownloadingProtected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloadingSource, setIsDownloadingSource] = useState(false)

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const clearValidationError = (id: string) => {
    setValidationErrors(prev => {
      // If error exists, remove it
      if (prev[id]) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return prev
    })
  }

  // --- Effects ---
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [generatedIsZip, setGeneratedIsZip] = useState(false)
  const [generatedZipUrl, setGeneratedZipUrl] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'before' | 'after'>('before')
  const [drawerFile, setDrawerFile] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [previewFilePath, setPreviewFilePath] = useState<string | null>(null)
  const [liveMode, setLiveMode] = useState(false)
  const { requireFeature, gateModal, isLoading: isFeaturesLoading, features } = useUpgradeGate()
  const { width: panelWidth, handleMouseDown: handlePanelResize } = useResizablePanel('builder-panel-width-pdf', 640)
  const canUseLivePreview = !!features?.livePreview

  const handleLiveModeToggle = () => {
    if (!requireFeature('livePreview')) return
    setLiveMode(v => {
      const next = !v
      if (!next) setPreviewMode('before')
      return next
    })
  }

  const [isPreviewReloading, setIsPreviewReloading] = useState(false)
  const lastPreviewRefreshRef = useRef(0)
  const previewRefreshFailCountRef = useRef(0)

  // Parse `X-Amz-Expires=3600` + `X-Amz-Date=...` from the presigned URL and schedule a
  // proactive refresh ~5 minutes before the link expires. Reactive refresh (on error) still
  // acts as a safety net if the timer didn't fire (tab sleeping, server clock skew, etc.).
  useEffect(() => {
    if (!previewFilePath) return
    try {
      const url = new URL(previewFilePath)
      const expiresSec = Number(url.searchParams.get('X-Amz-Expires'))
      const dateStr = url.searchParams.get('X-Amz-Date')
      if (!expiresSec || !dateStr) return
      // X-Amz-Date format: 20260424T040209Z
      const iso = dateStr.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z')
      const signedAt = Date.parse(iso)
      if (!signedAt) return
      const expireAt = signedAt + expiresSec * 1000
      const refreshAt = expireAt - 5 * 60 * 1000 // 5 min before expiry
      const ms = refreshAt - Date.now()
      if (ms <= 0) {
        refreshPreviewUrl()
        return
      }
      const t = setTimeout(() => {
        refreshPreviewUrl()
      }, ms)
      return () => clearTimeout(t)
    } catch {
      // URL parse failed — skip proactive refresh, reactive one will still kick in on error.
    }
  }, [previewFilePath])

  const refreshPreviewUrl = useCallback(async () => {
    // Throttle: skip if the last refresh was less than 5s ago (prevents error-loop storms).
    const now = Date.now()
    if (now - lastPreviewRefreshRef.current < 5000) return
    // Bail after 3 consecutive failures so the user sees the error card instead of a reload loop.
    if (previewRefreshFailCountRef.current >= 3) return
    if (!templateKeyParam) return

    lastPreviewRefreshRef.current = now
    setIsPreviewReloading(true)
    try {
      const template = await api.templates.getTemplateById(templateKeyParam)
      const fresh = template.activeVersion?.previewFilePathPresigned || null
      if (fresh) {
        previewRefreshFailCountRef.current = 0
        setPreviewFilePath(fresh)
      } else {
        previewRefreshFailCountRef.current += 1
      }
      if (template.fileSandboxLastTestPresigned) {
        setGeneratedUrl(template.fileSandboxLastTestPresigned)
      }
    } catch {
      previewRefreshFailCountRef.current += 1
    } finally {
      setIsPreviewReloading(false)
    }
  }, [templateKeyParam])

  const [templateName, setTemplateName] = useState('')
  const [templateKey, setTemplateKey] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [tempEditData, setTempEditData] = useState({ name: '', key: '' })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  const [isUpdateFileOpen, setIsUpdateFileOpen] = useState(false)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = useState(false)

  // Version State
  const [versions, setVersions] = useState<TemplateVersionResponse[]>([])
  const [activeVersion, setActiveVersion] = useState<number | null>(null)

  // Docs State
  const [isDocsOpen, setIsDocsOpen] = useState(false)
  const [activeDocsSection, setActiveDocsSection] = useState<
    'variables' | 'tables' | 'image' | 'qrcode' | 'barcode' | 'settings'
  >('variables')

  // Fonts for watermark font family picker
  const [fonts, setFonts] = useState<FontSummaryDto[]>([])

  useEffect(() => {
    if (templateKeyParam) {
      fetchTemplateDetails(templateKeyParam)
    }
    api.fonts
      .fontsList()
      .then(setFonts)
      .catch(() => {})
  }, [templateKeyParam])

  const fetchTemplateDetails = async (key: string) => {
    setIsLoading(true)
    try {
      const template = await api.templates.getTemplateById(key)
      setTemplateName(template.name || '')
      setTemplateKey(template.templateKey || '')
      setLastUpdated(template.updatedDatetime ?? template.createdDatetime ?? null)
      setPreviewFilePath(template.activeVersion?.previewFilePathPresigned || null)

      // Check for persistent result
      if (template.fileSandboxLastTestPresigned) {
        setGeneratedUrl(template.fileSandboxLastTestPresigned)
        // Default to 'before' (Template Source) as requested
        setPreviewMode('before')
      } else {
        setGeneratedUrl(null)
        setPreviewMode('before')
      }

      if (template.allVersions && template.allVersions.length > 0) {
        setVersions(template.allVersions)
      } else if (template.activeVersion) {
        setVersions([template.activeVersion])
      }
      setActiveVersion(template.activeVersion?.version != null ? Number(template.activeVersion.version) : null)

      if (template.sandboxPayload) {
        try {
          const parsed = JSON.parse(template.sandboxPayload)
          const fullRequest = {
            ...DEFAULT_UI_STATE,
            ...parsed,
            templateKey: template.templateKey || parsed.templateKey
          }
          setUiState(convertToUiState(fullRequest))
        } catch (e) {
          console.error('Failed to parse sandbox payload', e)
          setUiState({ ...DEFAULT_UI_STATE, templateKey: template.templateKey || '' })
        }
      } else {
        setUiState({ ...DEFAULT_UI_STATE, templateKey: template.templateKey || '' })
      }
    } catch (err) {
      handleApiError(err, 'Failed to load template.')
    } finally {
      setIsLoading(false)
    }
  }

  const validateUiState = (): boolean => {
    setValidationErrors({})
    return true
  }

  const handleGenerate = async () => {
    if (!validateUiState()) return
    setGenerating(true)
    try {
      const renderPayload = JSON.parse(JSON.stringify(convertFromUiState(uiState)))
      renderPayload.templateKey = templateKey
      const res = await api.render.wordTemplateSandboxCreate(templateKey, renderPayload, {
        fileName: uiState.fileName || undefined
      })
      if (res?.downloadUrl) {
        setPreviewMode('after')
        if (res.isZipped || res.fileType === 'zip') {
          setGeneratedIsZip(true)
          setGeneratedZipUrl(res.downloadUrl)
          setGeneratedUrl(null)
        } else {
          setGeneratedIsZip(false)
          setGeneratedZipUrl(null)
          setGeneratedUrl(res.downloadUrl)
          setDrawerFile(res.downloadUrl)
        }
      }
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
      const renderPayload = JSON.parse(JSON.stringify(convertFromUiState(state)))
      renderPayload.templateKey = templateKey
      return api.render.wordTemplateSandboxCreate(
        templateKey,
        renderPayload,
        { fileName: state.fileName || undefined },
        { signal }
      )
    },
    onRender: res => {
      setGeneratedUrl(res.downloadUrl)
      setPreviewMode('after')
    }
  })

  const handleDownloadProtected = async () => {
    if (!previewSrc) return
    setIsDownloadingProtected(true)
    try {
      await downloadFileFromUrl(previewSrc, `${templateName}_v${activeVersion || 'latest'}.pdf`)
    } catch (err) {
      handleApiError(err, 'Download failed. Please try again.')
    } finally {
      setIsDownloadingProtected(false)
    }
  }

  const handleGenerateWord = async () => {
    if (!validateUiState()) return
    setIsGeneratingWord(true)
    try {
      const payload = convertFromUiState(uiState)
      payload.templateKey = templateKey
      payload.fileType = 'docx'
      const res = await api.render.wordTemplateCreate(payload)
      if (res?.downloadUrl) {
        await downloadFileFromUrl(res.downloadUrl, `${uiState.fileName || templateName}.docx`)
        addToast({ title: 'Downloaded', description: 'Word file downloaded successfully.', color: 'success' })
      }
    } catch (err) {
      handleApiError(err, 'Generation failed. Please check your inputs.')
    } finally {
      setIsGeneratingWord(false)
    }
  }

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleSaveDetails = async () => {
    setIsSaving(true)
    try {
      const projectId = searchParams.get('projectId')
      const trimmedKey = tempEditData.key.trim()
      const keyChanged = !!trimmedKey && trimmedKey !== templateKey
      const effectiveKey = keyChanged ? trimmedKey : templateKey

      const payload = convertFromUiState(uiState)
      payload.templateKey = effectiveKey

      await api.templates.templatesUpdate(
        templateKey,
        {
          name: tempEditData.name,
          newTemplateKey: keyChanged ? trimmedKey : undefined,
          sandboxPayload: JSON.stringify(payload),
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
        router.replace(`/pdf/templates/${trimmedKey}${query}`)
      } else {
        fetchTemplateDetails(templateKey)
      }
    } catch (err) {
      handleApiError(err, 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (isEditOpen) {
      setTempEditData({ name: templateName, key: templateKey })
    }
  }, [isEditOpen, templateName, templateKey])

  const getExampleCode = (): CodeExamples => {
    const requestData = convertFromUiState(uiState)
    requestData.templateKey = templateKey

    // Fallback if no specific data exists (e.g. clean template mode)
    if (!requestData.fileName) requestData.fileName = 'generated_document'

    return getSdkCodeExamples(requestData, { documentType: 'pdf' })
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

  const handleUpdateFile = async (file: File) => {
    setIsSaving(true)
    try {
      const projectId = searchParams.get('projectId')
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
      setPreviewMode('before')
      fetchTemplateDetails(templateKey)
    } catch (err) {
      handleApiError(err, 'Failed to update file.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleVersionChange = async (version: number) => {
    try {
      await api.templates.switchVersionUpdate(templateKey, { version })
      setPreviewMode('before')
      setGeneratedUrl(null)
      fetchTemplateDetails(templateKey)
    } catch (err) {
      handleApiError(err, 'Failed to switch version.')
    }
  }

  useEffect(() => {
    if (!previewContainerRef.current) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    resizeObserver.observe(previewContainerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  // Detect scroll inside motion.main to toggle sticky height
  useEffect(() => {
    const mainEl = document.querySelector('main')
    if (!mainEl) return
    const handleScroll = () => setIsSticky(mainEl.scrollTop > 80)
    mainEl.addEventListener('scroll', handleScroll, { passive: true })
    return () => mainEl.removeEventListener('scroll', handleScroll)
  }, [])

  if (isLoading) {
    return (
      <div className='flex h-[calc(100vh-210px)] items-center justify-center bg-content1'>
        <Spinner size='lg' />
      </div>
    )
  }

  const previewSrc = liveMode
    ? generatedUrl || previewFilePath || ''
    : previewMode === 'before'
      ? previewFilePath || ''
      : generatedUrl
  const isLivePreviewResult = liveMode && !!generatedUrl && previewSrc === generatedUrl

  const handleDownloadSource = async () => {
    setIsDownloadingSource(true)
    try {
      const res = await api.templates.downloadTemplate(templateKey)
      if (res && res.url) {
        await downloadFileFromUrl(res.url, `${templateName}_v${activeVersion || 'latest'}.docx`)
      } else {
        addToast({ title: 'Error', description: 'Download URL not found', color: 'danger' })
      }
    } catch (e) {
      handleApiError(e, 'Failed to download template.')
    } finally {
      setIsDownloadingSource(false)
    }
  }

  return (
    <div className='flex flex-1 flex-col font-sans text-foreground'>
      <DeleteTemplateModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          const projectId = searchParams.get('projectId')
          if (projectId) router.push(`/project/${projectId}/pdf-templates`)
          else router.push('/')
        }}
        templateName={templateName}
        templateKey={templateKey}
      />

      <TemplateHeaderPortals
        templateType='pdf'
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

      {/* Main Content Area — Split Panel: left grows naturally, right stays sticky */}
      <div className='flex items-start'>
        {/* Left Panel: Builder Area — grows with content, no internal scroll */}
        <div
          className='builder-shell flex shrink-0 flex-col rounded-2xl'
          style={{ width: `${panelWidth}px` }}>
          <div className='shrink-0 px-4 pt-2 md:px-5'>
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
            <div className='flex w-full flex-col gap-4 px-4 pb-5 pt-1 md:flex-row md:px-5'>
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
                      label: 'Settings',
                      section: 'config',
                      count: (uiState.pdfPassword ? 1 : 0) + (uiState.watermark ? 1 : 0) + (uiState.zipOutput ? 1 : 0)
                    }
                  ] as const
                }
              />

              {/* Section content */}
              <div className='min-w-0 flex-1 overflow-visible'>
                {activeBuilderCategory === 'text' && (
                  <SectionWrapper
                    title='Variables'
                    description='Text tokens replaced at render time'
                    action={
                      <Button
                        size='sm'
                        radius='md'
                        onPress={() => {
                          const newId = generateId()
                          setUiState(p => ({
                            ...p,
                            replace: [...p.replace, { id: newId, key: '', value: '' }]
                          }))
                        }}
                        variant='flat'
                        className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                        startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                        Add Variable
                      </Button>
                    }>
                    <ReplacementsSection
                      items={uiState.replace}
                      onChange={d => setUiState(p => ({ ...p, replace: d }))}
                      errors={validationErrors}
                      onClearError={clearValidationError}
                    />
                  </SectionWrapper>
                )}

                {activeBuilderCategory === 'tables' && (
                  <SectionWrapper
                    title='Tables'
                    description='Dynamic rows populated from structured data'
                    action={
                      <Button
                        size='sm'
                        radius='md'
                        onPress={() => {
                          const newId = generateId()
                          setUiState(p => ({ ...p, table: [...p.table, { id: newId, columns: [], rows: [] }] }))
                        }}
                        variant='flat'
                        className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                        startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                        Add Table
                      </Button>
                    }>
                    <TablesSection
                      items={uiState.table}
                      onChange={d => setUiState(p => ({ ...p, table: d }))}
                      errors={validationErrors}
                      onClearError={clearValidationError}
                    />
                  </SectionWrapper>
                )}

                {activeBuilderCategory === 'image' && (
                  <SectionWrapper
                    title='Images'
                    description='Image tokens replaced with uploaded files'
                    action={
                      <Button
                        size='sm'
                        radius='md'
                        onPress={() => {
                          const newId = generateId()
                          setUiState(p => ({
                            ...p,
                            image: [...p.image, { id: newId, key: '', data: { src: '', fit: 'cover' } }]
                          }))
                        }}
                        variant='flat'
                        className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                        startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                        Add Image
                      </Button>
                    }>
                    <ImagesSection
                      items={uiState.image}
                      onChange={d => setUiState(p => ({ ...p, image: d }))}
                      errors={validationErrors}
                      onClearError={clearValidationError}
                    />
                  </SectionWrapper>
                )}

                {activeBuilderCategory === 'qrcode' && (
                  <SectionWrapper
                    title='QR Codes'
                    description='Generate QR codes from text values'
                    action={
                      <Button
                        size='sm'
                        radius='md'
                        onPress={() => {
                          const newId = generateId()
                          setUiState(p => ({
                            ...p,
                            qrcode: [...p.qrcode, { id: newId, key: '', data: { text: '' } }]
                          }))
                        }}
                        variant='flat'
                        className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                        startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                        Add QR
                      </Button>
                    }>
                    <QrCodesSection
                      items={uiState.qrcode}
                      onChange={d => setUiState(p => ({ ...p, qrcode: d }))}
                      errors={validationErrors}
                      onClearError={clearValidationError}
                    />
                  </SectionWrapper>
                )}

                {activeBuilderCategory === 'barcode' && (
                  <SectionWrapper
                    title='Barcodes'
                    description='Generate Code128 / EAN13 barcodes'
                    action={
                      <Button
                        size='sm'
                        radius='md'
                        onPress={() => {
                          const newId = generateId()
                          setUiState(p => ({
                            ...p,
                            barcode: [
                              ...p.barcode,
                              {
                                id: newId,
                                key: '',
                                data: { text: '', format: 'Code128', width: 200, height: 50, includeText: true }
                              }
                            ]
                          }))
                        }}
                        variant='flat'
                        className='h-8 gap-1 bg-content2 px-3 text-[11.5px] font-semibold text-default-700 transition-colors duration-200 hover:bg-content3'
                        startContent={<Icon icon='lucide:plus' className='h-3.5 w-3.5' strokeWidth={2.5} />}>
                        Add Barcode
                      </Button>
                    }>
                    <BarcodesSection
                      items={uiState.barcode}
                      onChange={d => setUiState(p => ({ ...p, barcode: d }))}
                      errors={validationErrors}
                      onClearError={clearValidationError}
                    />
                  </SectionWrapper>
                )}

                {activeBuilderCategory === 'settings' && (
                  <SectionWrapper title='File Settings' description='PDF password, watermark, output format'>
                    <FileSettingsSection
                      requireFeature={requireFeature}
                      fileName={uiState.fileName}
                      pdfPassword={uiState.pdfPassword}
                      watermark={uiState.watermark}
                      zipOutput={uiState.zipOutput}
                      fonts={fonts}
                      onChange={updates =>
                        setUiState(p => ({
                          ...p,
                          ...(Object.prototype.hasOwnProperty.call(updates, 'fileName') && {
                            fileName: updates.fileName ?? ''
                          }),
                          ...(Object.prototype.hasOwnProperty.call(updates, 'pdfPassword') && {
                            pdfPassword: updates.pdfPassword
                          }),
                          ...(Object.prototype.hasOwnProperty.call(updates, 'watermark') && {
                            watermark: updates.watermark
                          }),
                          ...(Object.prototype.hasOwnProperty.call(updates, 'zipOutput') && {
                            zipOutput: updates.zipOutput
                          })
                        }))
                      }
                    />
                  </SectionWrapper>
                )}
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
        <div
          ref={previewContainerRef}
          className='builder-shell sticky top-0 hidden h-[calc(100vh-110px)] w-full flex-1 flex-col overflow-hidden rounded-2xl lg:flex'>
          {/* Preview Header — theme-aware colors for light/dark mode */}
          <div className='flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-default-200/70 px-4 py-2.5'>
            <div className='flex items-center gap-2'>
              <Icon icon='lucide:file-text' className='h-4 w-4 text-default-500' />
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
              <div className='mx-1 h-5 w-px bg-default-200/80' />
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
              <div className='mx-1 h-5 w-px bg-default-200/80' />
              <div className='flex'>
                <Button
                  color='primary'
                  size='sm'
                  radius='none'
                  className='h-8 rounded-l-md border-r border-primary-foreground/20 px-3 text-[11.5px] font-bold'
                  isLoading={isGenerating || isGeneratingWord}
                  onPress={generateFormat === 'pdf' ? handleGenerate : handleGenerateWord}
                  startContent={
                    !(isGenerating || isGeneratingWord) && <Icon icon='lucide:zap' className='h-3.5 w-3.5' />
                  }>
                  Generate{generateFormat === 'word' ? ' Word' : ''}
                </Button>
                <Dropdown placement='bottom-end'>
                  <DropdownTrigger>
                    <Button
                      color='primary'
                      size='sm'
                      radius='none'
                      isIconOnly
                      isDisabled={isGenerating || isGeneratingWord}
                      className='h-8 w-7 min-w-7 rounded-r-md'>
                      <Icon icon='lucide:chevron-down' className='h-3.5 w-3.5' />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label='Generate format'
                    selectionMode='single'
                    selectedKeys={[generateFormat]}
                    onAction={key => setGenerateFormat(key as 'pdf' | 'word')}>
                    <DropdownItem
                      key='pdf'
                      startContent={<Icon icon='lucide:zap' className='h-4 w-4 shrink-0 text-primary' />}
                      description='Test current values — downloads .pdf'>
                      Generate PDF
                    </DropdownItem>
                    <DropdownItem
                      key='word'
                      startContent={<Icon icon='lucide:file-down' className='h-4 w-4 shrink-0 text-primary' />}
                      description='Test current values — downloads .docx'>
                      Generate Word
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className='no-scrollbar flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto bg-content2/35 p-4'>
            <div className='w-full max-w-4xl'>
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
                      void downloadFileFromUrl(generatedZipUrl, `${uiState.fileName || templateName}.zip`)
                    }}>
                    Download ZIP
                  </Button>
                </div>
              ) : generatedUrl ? (
                /* PDF result in-panel */
                <div className='w-full transition-all duration-300'>
                  {liveMode && (
                    <div className='mb-3 flex items-center gap-2 rounded-md bg-content2/70 px-3 py-2 text-[10.5px] text-default-600 ring-1 ring-default-200/70'>
                      {isLivePreviewRendering ? (
                        <Spinner size='sm' color='primary' />
                      ) : (
                        <Icon
                          icon={livePreviewError ? 'lucide:triangle-alert' : 'lucide:check-circle-2'}
                          className={cn('h-3.5 w-3.5 shrink-0', livePreviewError ? 'text-danger' : 'text-primary')}
                        />
                      )}
                      <span>
                        {livePreviewError
                          ? livePreviewError
                          : isLivePreviewRendering
                            ? 'Updating live preview...'
                            : 'Live preview is showing the latest rendered output.'}
                      </span>
                    </div>
                  )}
                  {liveMode && isLivePreviewRendering && !generatedUrl ? (
                    <Skeleton className='h-full min-h-[500px] w-full rounded-lg' />
                  ) : (
                    <PdfPreview
                      key={generatedUrl}
                      file={generatedUrl}
                      fileName={`${uiState.fileName || templateName}.pdf`}
                      loading={<Skeleton className='h-full min-h-[500px] w-full' />}
                      className='flex flex-col gap-4'
                      width={containerWidth ? containerWidth - 32 : undefined}
                      onLoadError={refreshPreviewUrl}
                      isReloading={isPreviewReloading}
                      onDownloadResult={(url, name) => { void downloadFileFromUrl(url, name) }}
                    />
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
                    Press Generate to render and preview the output here.
                  </p>
                </div>
              )
            ) : /* Source tab */ previewSrc ? (
              <div className='w-full transition-all duration-300'>
                {!liveMode && (
                  <div className='mb-3 flex items-center gap-2 rounded-md bg-content2/70 px-3 py-2 text-[10.5px] text-default-600 ring-1 ring-default-200/70'>
                    <Icon icon='lucide:info' className='h-3.5 w-3.5 shrink-0 text-default-500' />
                    <span>
                      Source preview — variable values won&apos;t appear here. Generate PDF to see rendered output.
                    </span>
                  </div>
                )}
                {liveMode && (
                  <div className='mb-3 flex items-center gap-2 rounded-md bg-content2/70 px-3 py-2 text-[10.5px] text-default-600 ring-1 ring-default-200/70'>
                    {isLivePreviewRendering ? (
                      <Spinner size='sm' color='primary' />
                    ) : (
                      <Icon
                        icon={livePreviewError ? 'lucide:triangle-alert' : 'lucide:check-circle-2'}
                        className={cn('h-3.5 w-3.5 shrink-0', livePreviewError ? 'text-danger' : 'text-primary')}
                      />
                    )}
                    <span>
                      {livePreviewError
                        ? livePreviewError
                        : isLivePreviewRendering
                          ? 'Updating live preview...'
                          : isLivePreviewResult
                            ? 'Live preview is showing the latest rendered output.'
                            : 'Live preview is ready. Edit builder values to render the output.'}
                    </span>
                  </div>
                )}
                {liveMode && isLivePreviewRendering && !generatedUrl ? (
                  <Skeleton className='h-full min-h-[500px] w-full rounded-lg' />
                ) : (
                  <PdfPreview
                    key={previewSrc}
                    file={previewSrc}
                    fileName={
                      isLivePreviewResult ? `${templateName}_live_preview.pdf` : `${templateName}_template_source.pdf`
                    }
                    loading={<Skeleton className='h-full min-h-[500px] w-full' />}
                    className='flex flex-col gap-4'
                    width={containerWidth ? containerWidth - 32 : undefined}
                    onLoadError={refreshPreviewUrl}
                    isReloading={isPreviewReloading}
                    onDownloadResult={(url, name) => { void downloadFileFromUrl(url, name) }}
                  />
                )}
              </div>
            ) : (
              <div className='flex min-h-[280px] w-full flex-col items-center justify-center p-8 text-center'>
                <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-content2'>
                  <Icon icon='lucide:file-text' className='h-8 w-8 text-default-500' />
                </div>
                <h3 className='font-semibold text-foreground'>No Preview Available</h3>
                <p className='mt-1 max-w-xs text-sm text-default-600'>
                  Upload a DOCX template file to see the source preview.
                </p>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Mobile: FAB to open preview (since preview panel hidden below lg) */}
        <button
          onClick={() => setIsExpanded(true)}
          className='fixed bottom-4 right-4 z-40 flex h-12 items-center gap-2 rounded-lg bg-primary px-4 text-[12px] font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-105 active:scale-95 lg:hidden'
          aria-label='Open preview'>
          <Icon icon='lucide:file-text' className='h-4 w-4' />
          Preview
        </button>

        {/* Preview Drawer — accessible from BOTH desktop expand button AND mobile FAB */}
        <PdfPreviewDrawer
          isOpen={isExpanded}
          onClose={() => {
            setIsExpanded(false)
            setDrawerFile(null)
            setLiveMode(false)
            setPreviewMode('before')
          }}
          file={drawerFile || previewSrc || ''}
          fileName={
            drawerFile
              ? `${uiState.fileName || templateName}.pdf`
              : isLivePreviewResult
                ? `${templateName}_live_preview.pdf`
                : `${templateName}_template_source.pdf`
          }
        />

        <UpdateFileModal
          isOpen={isUpdateFileOpen}
          onOpenChange={setIsUpdateFileOpen}
          templateType='pdf'
          isSaving={isSaving}
          onSubmit={handleUpdateFile}
        />

        {/* Documentation Modal */}
        <Modal isOpen={isDocsOpen} onOpenChange={setIsDocsOpen} size='5xl' scrollBehavior='inside'>
          <ModalContent className='h-[90vh]'>
            {onClose => (
              <>
                <ModalHeader className='flex flex-col gap-1'>Template Documentation</ModalHeader>
                <ModalBody className='p-0'>
                  <div className='flex h-full flex-col'>
                    <div className='w-full border-b border-default-200/50 bg-content2 p-4'>
                      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5'>
                        {(
                          [
                            { id: 'variables', label: 'Variables', icon: 'lucide:type' },
                            { id: 'tables', label: 'Tables', icon: 'lucide:table' },
                            { id: 'image', label: 'Images', icon: 'lucide:image' },
                            { id: 'qrcode', label: 'QR Codes', icon: 'lucide:qr-code' },
                            { id: 'barcode', label: 'Barcodes', icon: 'lucide:barcode' },
                            { id: 'settings', label: 'File Settings', icon: 'lucide:settings' }
                          ] as const
                        ).map(item => (
                          <button
                            key={item.id}
                            onClick={() => setActiveDocsSection(item.id)}
                            className={cn(
                              'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                              activeDocsSection === item.id
                                ? 'bg-content3 text-primary'
                                : 'text-default-600 hover:bg-content2 hover:text-foreground'
                            )}>
                            <Icon icon={item.icon} className='h-4 w-4' />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className='flex-1 overflow-y-auto p-6'>
                      <div className='prose prose-sm max-w-none'>
                        {activeDocsSection === 'variables' && <VariablesContent />}
                        {activeDocsSection === 'tables' && <TablesContent />}
                        {activeDocsSection === 'image' && <ImagesContent />}
                        {activeDocsSection === 'qrcode' && (
                          <div className='space-y-8'>
                            <QrCodesContent />
                          </div>
                        )}
                        {activeDocsSection === 'barcode' && <BarcodesContent />}
                        {activeDocsSection === 'settings' && <FileSettingsContent />}
                      </div>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color='primary' onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {gateModal}
      </div>
    </div>
  )
}

import { Suspense } from 'react'

export default function TemplateSandboxPageWrapper() {
  return (
    <Suspense>
      <TemplateSandboxPage />
    </Suspense>
  )
}
