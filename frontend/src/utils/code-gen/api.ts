import type { CodeGenOptions } from './types'

const getEndpoint = (documentType: CodeGenOptions['documentType']) =>
  documentType === 'excel' ? '/render/excel/template' : '/render/word/template'

const getApiUrl = (apiUrl?: string) => apiUrl || '${API_URL}'

export const generateApiExample = (data: any, options: CodeGenOptions = {}): string => {
  const prettyJson = JSON.stringify(data, null, 2)
  const endpoint = getEndpoint(options.documentType)
  const baseUrl = getApiUrl(options.apiUrl)

  return `Method: POST
URL: ${baseUrl}${endpoint}
Headers:
  Content-Type: application/json
  X-API-KEY: YOUR_API_KEY

Body (JSON):
${prettyJson}`
}
