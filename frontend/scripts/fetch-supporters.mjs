/**
 * fetch-supporters.mjs
 *
 * Pulls the Supporters wall data from a Google Sheet into src/data/supporters.json,
 * which supporters-section.tsx imports. Runs at build time (see vercel.json).
 *
 * One flat sheet (the first/default tab) with a `type` column:
 *   type | name | tier | company | role | avatar | link
 *   - type:   founder | enterprise | supporter
 *   - tier:   early-bird | founding   (supporters only)
 *   - avatar: image URL or /supporters/<name>.png   (optional)
 *   - link:   profile / website URL                 (optional)
 *
 * The spreadsheet ID is not a secret (it's in the share URL) — data privacy comes
 * from the sheet's sharing setting, which must be "Anyone with the link: Viewer"
 * (or public) for the build to read it. Override the ID with SUPPORTERS_SHEET_ID.
 *
 * SAFETY: non-fatal. If the sheet is unreachable or has no rows, the committed
 * supporters.json is left untouched so the build never breaks.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const SHEET_ID = process.env.SUPPORTERS_SHEET_ID || '1y1Z0FKKyza145OUQa5EtewbI-3O_ZvQfbp9U79hjHoA'
const SHEET_GID = process.env.SUPPORTERS_SHEET_GID || '776217107'
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`
const OUT = path.join(process.cwd(), 'src', 'data', 'supporters.json')

const DEFAULT_FOUNDER = {
  name: 'Satang Budsai',
  role: 'Creator & Maintainer',
  avatar: null,
  link: 'https://github.com/qorstack',
}

const clean = v => {
  const s = (v ?? '').trim()
  return s.length ? s : null
}

// Minimal quote-aware CSV parser (handles "" escapes, commas + newlines in quotes).
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c !== '"') {
        field += c
      } else if (text[i + 1] === '"') {
        field += '"'
        i++
      } else {
        inQuotes = false
      }
      continue
    }
    if (c === '"') inQuotes = true
    else if (c === ',') endField()
    else if (c === '\n') endRow()
    else if (c !== '\r') field += c
  }
  if (field.length || row.length) endRow()
  return rows.filter(r => r.some(cell => cell.trim().length))
}

function toData(csv) {
  const rows = parseCsv(csv)
  if (rows.length < 2) return null
  const header = rows[0].map(h => h.trim().toLowerCase())
  const idx = {}
  header.forEach((h, i) => (idx[h] = i))
  const get = (row, key) => (idx[key] != null ? clean(row[idx[key]]) : null)

  let founder = null
  const enterprise = []
  const supporters = []

  for (const row of rows.slice(1)) {
    const name = get(row, 'name')
    if (!name) continue
    const type = (get(row, 'type') || 'supporter').toLowerCase()
    if (type === 'founder') {
      founder = { name, role: get(row, 'role'), avatar: get(row, 'avatar'), link: get(row, 'link') }
    } else if (type === 'enterprise') {
      enterprise.push({
        name,
        company: get(row, 'company'),
        role: get(row, 'role'),
        avatar: get(row, 'avatar'),
        link: get(row, 'link'),
      })
    } else {
      supporters.push({
        name,
        tier: get(row, 'tier') === 'founding' ? 'founding' : 'early-bird',
        avatar: get(row, 'avatar'),
        link: get(row, 'link'),
      })
    }
  }

  if (!founder && enterprise.length === 0 && supporters.length === 0) return null
  return { founder: founder || DEFAULT_FOUNDER, enterprise, supporters }
}

async function main() {
  try {
    const res = await fetch(CSV_URL, { redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const csv = await res.text()
    if (csv.trimStart().startsWith('<')) throw new Error('got HTML, not CSV (sheet not shared as Viewer?)')
    const data = toData(csv)
    if (!data) throw new Error('sheet has no data rows yet')
    mkdirSync(path.dirname(OUT), { recursive: true })
    writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n')
    console.log(
      `[supporters] wrote ${path.relative(process.cwd(), OUT)} — ` +
        `founder=${data.founder.name}, enterprise=${data.enterprise.length}, supporters=${data.supporters.length}`
    )
  } catch (err) {
    const exists = existsSync(OUT)
    console.warn(`[supporters] ${err.message} — keeping ${exists ? 'existing' : 'default'} supporters.json.`)
    if (!exists) {
      mkdirSync(path.dirname(OUT), { recursive: true })
      writeFileSync(OUT, JSON.stringify({ founder: DEFAULT_FOUNDER, enterprise: [], supporters: [] }, null, 2) + '\n')
    }
  }
}

await main()
