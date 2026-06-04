import { CodeExamples, CodeGenOptions } from './types'
import { generateCsharpExample } from './csharp'
import { generateNodejsExample } from './nodejs'
import { generateApiExample } from './api'

export const getSdkCodeExamples = (data: any, options: CodeGenOptions = {}): CodeExamples => {
  const prettyJson = JSON.stringify(data, null, 2)
  const hasExcelOptions = (data.table || []).some(
    (table: any) => table.freezeHeader || table.autoFilter || table.autoFitColumns
  )
  const documentType = options.documentType || (hasExcelOptions ? 'excel' : 'pdf')
  const apiUrl = options.apiUrl || process.env.NEXT_PUBLIC_SERVICE || ''

  return {
    json: prettyJson,
    api: generateApiExample(data, { documentType, apiUrl }),
    nodejs: generateNodejsExample(data, { documentType, apiUrl }),
    csharp: generateCsharpExample(data, { documentType, apiUrl }),
    dotnet: generateCsharpExample(data, { documentType, apiUrl })
  }
}

export * from './types'
export { generateCsharpExample } from './csharp'
export { generateNodejsExample } from './nodejs'
export { generateApiExample } from './api'
