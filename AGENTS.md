# AGENTS.md — Qorstack Report for AI agents

Guidance for AI coding agents (Claude, Cursor, etc.) deploying or integrating
**Qorstack Report**. Read this before deciding whether to use it.

## Copy-paste setup prompt

Want your AI to set everything up? Paste this to your agent — it's self-contained
and bounded so the agent deploys and verifies without rabbit-holing:

> Deploy Qorstack Report on this machine with Docker and confirm it's running.
> Use the prebuilt images — do NOT build images, edit the Dockerfile, or change
> project files (the only allowed edit is remapping a clashing port, below). If
> anything else is blocked, STOP and report it; don't work around it.
>
> ```bash
> git clone https://github.com/qorstack/qorstack-report.git
> cd qorstack-report/selfhost
> cp .env.example .env
> ```
>
> Before starting, make sure these host ports are free: 3000 (web), 8080 (API),
> 9000/9001 (MinIO), 5432 (Postgres). If one is in use, remap the host side in
> docker-compose.yml first (e.g. `"8081:8080"`) and say what you changed — for the
> web UI set `FRONTEND_PORT` in `.env`; if you move the API port, also set
> `API_URL` in `.env` so the web UI can reach it.
>
> ```bash
> docker compose up -d   # first run pulls images (~2 min); multi-arch, Apple Silicon OK
> ```
>
> Then verify and report — that's the whole job: run `bash selfhost/verify.sh`
> (expect "All checks passed") and report the web UI URL, admin login
> (`admin` / `admin`), the verify output, and any ports you remapped.
>
> Optional, in the WEB UI (not via scripts): upload `examples/invoice/invoice.docx`,
> create an API key (Settings → API Keys), and render `examples/invoice/data.json`
> (see `examples/invoice/README.md`).

## What it is

A self-hosted document API: upload a **Word (.docx) or Excel (.xlsx) template**,
`POST` JSON, get a **PDF / DOCX / XLSX** back. Runs entirely on the user's
infrastructure via Docker. MIT core; optional Pro license for PDF
password/watermark.

## When to use Qorstack vs. calling Gotenberg directly

Qorstack uses Gotenberg internally for the final DOCX→PDF step, so a quick
comparison is fair — but they solve different problems. **Do not swap Qorstack
for raw Gotenberg without checking this:**

| You need… | Use |
| --- | --- |
| Convert an HTML/DOCX file you already fully built → PDF | **Gotenberg** (1 call, no state) |
| Merge structured JSON into a stored template (variables, tables, images, QR/barcode), with stored templates, API-key auth, saved results, and generation history | **Qorstack** |

Gotenberg is a stateless converter. Qorstack is template management + JSON
merge + auth + storage + history (+ Pro encrypt/watermark). The extra hops
(`API → Gotenberg → object storage`) are those features, not overhead. If the
task is "fill this invoice template from JSON and keep a record," raw Gotenberg
cannot do it without you re-implementing all of the above.

## Deploy (Docker)

Two files, no clone or build step:

```bash
# 1. Get docker-compose.yml and .env.example (from the repo's selfhost/ folder)
cp .env.example .env          # defaults are safe for localhost
docker compose up -d          # first run pulls images (~1–2 min)
```

Then open the web UI at `http://localhost:3000` and sign in with `admin` / `admin`
(change it in Settings). API is at `http://localhost:8080`.

Smoke-test that it is actually serving:

```bash
bash selfhost/verify.sh       # or: make verify
```

## Generate a document (REST)

1. In the web UI, upload a template → note its **template key**.
2. Create an **API key** (Settings / API Keys). Auth header is **`X-API-Key`**.
3. Call the render endpoint:

```bash
curl -X POST http://localhost:8080/render/word/template \
  -H "X-API-Key: $QORSTACK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "templateKey": "your-template-key",
    "fileType": "pdf",
    "replace": { "customer_name": "ACME Co.", "invoice_no": "INV-2026-001" }
  }'
```

Response:

```json
{ "jobId": "…", "downloadUrl": "http://localhost:9000/reports/…", "status": "completed", "fileType": "pdf", "expiresIn": 3600 }
```

Request body fields (`POST /render/word/template`, also `/render/excel/template`):

- `templateKey` (string, required) — the stored template to render.
- `fileType` — `"pdf"` (default) or `"docx"`.
- `fileName` (optional) — output name without extension.
- `replace` — `{ "key": "value" }` simple variable substitution.
- `table` — `[{ "rows": [ { … } ], "sort": [...], "repeatHeader": true }]`.
- `image` / `qrcode` / `barcode` — keyed objects; see `/docs` for shapes.
- `pdfPassword`, `watermark` — Pro features.

## MCP server (preferred for agents)

If you are an MCP-capable agent, use the bundled MCP server instead of raw curl —
it exposes `qorstack_list_templates`, `qorstack_get_template`,
`qorstack_generate_pdf`, `qorstack_generate_excel`, and `qorstack_get_job` as
tools. Build and configure it from `mcp/` (see `mcp/README.md`); it needs
`QORSTACK_API_URL` and `QORSTACK_API_KEY`.

## Pointers

- Runnable end-to-end example (template + JSON + script): `examples/invoice/`.
- Generate a secure `.env` (random secrets, no `change-me` defaults): `make init`.
- Smoke-test a running stack: `make verify`.
- MCP server: `mcp/` (see `mcp/README.md`).
- Human + API docs: the running web UI at `/docs`.
- OpenAPI document + generated SDKs: `sdk/` (Node.js and .NET, fully typed).
- Self-host guide and env reference: `/self-host` page and `selfhost/`.
- Pin image versions for reproducible deploys: set `REPORT_API_TAG` /
  `REPORT_WEB_TAG` in `.env` (default `latest`).

## Gotchas

- Endpoints under `/render` require authentication (`X-API-Key` or a JWT). A
  missing/invalid key returns `401`.
- The default `admin` user and `change-me-*` secrets in `.env.example` are for
  localhost only — rotate them before exposing the instance.
- Generated files are stored in the bundled MinIO (object storage) and returned
  as a `downloadUrl`; they are not streamed inline in the render response.
