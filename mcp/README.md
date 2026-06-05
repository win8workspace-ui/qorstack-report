# Qorstack Report — MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI
agents (Claude Desktop, Claude Code, Cursor, …) first-class tools for generating
documents with [Qorstack Report](https://github.com/qorstack/qorstack-report) —
so an agent can list templates and produce PDF/DOCX/XLSX without reverse-engineering
the REST API.

## Tools

| Tool | What it does |
| --- | --- |
| `qorstack_list_templates` | List stored templates available to your API key |
| `qorstack_get_template` | Get one template's details by `templateKey` |
| `qorstack_generate_pdf` | Render a Word template → PDF/DOCX from JSON; returns a `downloadUrl` |
| `qorstack_generate_excel` | Render an Excel template → XLSX/PDF from JSON; returns a `downloadUrl` |
| `qorstack_get_job` | Get a render job's status/result by id |

## Build

```bash
cd mcp
pnpm install
pnpm build      # emits dist/index.js
```

## Configure

The server needs your running Qorstack Report API and an API key (created in the
web UI under Settings → API Keys; sent as the `X-API-Key` header).

| Env var | Default | Notes |
| --- | --- | --- |
| `QORSTACK_API_URL` | `http://localhost:8080` | Base URL of the Qorstack Report API |
| `QORSTACK_API_KEY` | _(required)_ | API key for authentication |

### Claude Desktop / Claude Code (`mcpServers` config)

```json
{
  "mcpServers": {
    "qorstack-report": {
      "command": "node",
      "args": ["/absolute/path/to/qorstack-report/mcp/dist/index.js"],
      "env": {
        "QORSTACK_API_URL": "http://localhost:8080",
        "QORSTACK_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Example

> "Generate a PDF from template `invoice-v1` with customer_name = ACME Co. and invoice_no = INV-2026-001."

The agent calls `qorstack_generate_pdf` and gets back `{ jobId, downloadUrl, status }`.
