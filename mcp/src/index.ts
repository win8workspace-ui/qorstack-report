#!/usr/bin/env node
/**
 * Qorstack Report — MCP server
 *
 * Exposes Qorstack Report's document API to MCP-capable AI agents (Claude, Cursor, …)
 * as first-class tools, so an agent can list templates and generate PDF/DOCX/XLSX
 * without reverse-engineering the REST API.
 *
 * Configuration (environment variables):
 *   QORSTACK_API_URL   Base URL of the Qorstack Report API (default http://localhost:8080)
 *   QORSTACK_API_KEY   API key for authentication (sent as the X-API-Key header). Required.
 *
 * Transport: stdio (the standard for locally-launched MCP servers).
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_URL = (process.env.QORSTACK_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')
const API_KEY = process.env.QORSTACK_API_KEY ?? ''

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean }

const ok = (data: unknown): ToolResult => ({
  content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }]
})

const err = (message: string): ToolResult => ({
  content: [{ type: 'text', text: message }],
  isError: true
})

/** Call the Qorstack API with the configured key. Returns parsed JSON on 2xx, throws otherwise. */
const apiFetch = async (path: string, init: RequestInit = {}): Promise<unknown> => {
  if (!API_KEY) {
    throw new Error('QORSTACK_API_KEY is not set. Create an API key in the Qorstack web UI (Settings → API Keys) and set QORSTACK_API_KEY.')
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} from ${path}\n${text}`)
  }
  return text ? JSON.parse(text) : null
}

const server = new McpServer({ name: 'qorstack-report', version: '0.1.0' })

server.registerTool(
  'qorstack_list_templates',
  {
    title: 'List templates',
    description: 'List the stored Qorstack Report templates available to the current API key. Use the returned templateKey with the generate tools.',
    inputSchema: {}
  },
  async (): Promise<ToolResult> => {
    try {
      return ok(await apiFetch('/templates'))
    } catch (e: any) {
      return err(e.message)
    }
  }
)

server.registerTool(
  'qorstack_get_template',
  {
    title: 'Get template',
    description: 'Get details of a single stored template by its templateKey (variables, sheets, version info).',
    inputSchema: { templateKey: z.string().describe('The stored template key') }
  },
  async ({ templateKey }): Promise<ToolResult> => {
    try {
      return ok(await apiFetch(`/templates/${encodeURIComponent(templateKey)}`))
    } catch (e: any) {
      return err(e.message)
    }
  }
)

const generateInput = {
  templateKey: z.string().describe('The stored template key to render'),
  fileName: z.string().optional().describe('Output file name without extension (a UUID is used if omitted)'),
  replace: z.record(z.string(), z.string()).optional().describe('Simple variable substitution: { "placeholder": "value" }'),
  table: z.array(z.record(z.string(), z.any())).optional().describe('Table data: [{ rows: [...], sort?, repeatHeader? }]'),
  image: z.record(z.string(), z.any()).optional().describe('Image injection, keyed by placeholder'),
  qrcode: z.record(z.string(), z.any()).optional().describe('QR codes, keyed by placeholder'),
  barcode: z.record(z.string(), z.any()).optional().describe('Barcodes, keyed by placeholder')
}

/** Drop undefined keys so the request body only carries what the caller provided. */
const compact = (obj: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

server.registerTool(
  'qorstack_generate_pdf',
  {
    title: 'Generate PDF/DOCX from template',
    description: 'Render a stored Word template to PDF (or DOCX) by merging JSON data. Returns a job id and a downloadUrl.',
    inputSchema: {
      ...generateInput,
      fileType: z.enum(['pdf', 'docx']).default('pdf').describe('Output format')
    }
  },
  async (args): Promise<ToolResult> => {
    try {
      const body = compact({ ...args })
      return ok(await apiFetch('/render/word/template', { method: 'POST', body: JSON.stringify(body) }))
    } catch (e: any) {
      return err(e.message)
    }
  }
)

server.registerTool(
  'qorstack_generate_excel',
  {
    title: 'Generate Excel/PDF from template',
    description: 'Render a stored Excel (.xlsx) template by merging JSON data. Output as xlsx or pdf. Returns a job id and a downloadUrl.',
    inputSchema: {
      ...generateInput,
      fileType: z.enum(['xlsx', 'pdf']).default('xlsx').describe('Output format')
    }
  },
  async (args): Promise<ToolResult> => {
    try {
      const body = compact({ ...args })
      return ok(await apiFetch('/render/excel/template', { method: 'POST', body: JSON.stringify(body) }))
    } catch (e: any) {
      return err(e.message)
    }
  }
)

server.registerTool(
  'qorstack_get_job',
  {
    title: 'Get render job',
    description: 'Get the status and result (downloadUrl, errorMessage) of a render job by its id.',
    inputSchema: { jobId: z.string().describe('The render job id returned by a generate tool') }
  },
  async ({ jobId }): Promise<ToolResult> => {
    try {
      return ok(await apiFetch(`/render/jobs/${encodeURIComponent(jobId)}`))
    } catch (e: any) {
      return err(e.message)
    }
  }
)

const main = async (): Promise<void> => {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stderr is safe for logs; stdout is reserved for the MCP protocol.
  console.error(`qorstack-report MCP server running (API: ${API_URL})`)
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
