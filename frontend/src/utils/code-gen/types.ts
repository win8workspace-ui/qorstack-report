export interface CodeExamples {
  json?: string
  api?: string
  curl?: string
  nodejs?: string
  ts?: string
  csharp?: string
  dotnet?: string
  go?: string
  python?: string
  java?: string
  php?: string
  rust?: string
  other?: string
  [key: string]: string | undefined
}

export type DocumentType = 'pdf' | 'excel'

export interface CodeGenOptions {
  documentType?: DocumentType
  apiUrl?: string
}
