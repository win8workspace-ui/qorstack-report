/**
 * prepare-marketing-build.mjs
 *
 * Strips the app/api route groups that require the .NET backend so Vercel ships a
 * marketing-only bundle (landing + public docs/demo/pricing/self-host). Intended to run
 * in Vercel's ephemeral checkout via the build command in vercel.json.
 *
 * SAFETY: only runs when BUILD_TARGET=marketing. A normal `next build` (self-host / dev)
 * sets nothing, so this is a no-op there and never touches your working tree.
 */
import { rmSync, existsSync } from 'node:fs'
import path from 'node:path'

if (process.env.BUILD_TARGET !== 'marketing') {
  console.log('[marketing] BUILD_TARGET != "marketing" — skipping route strip (full build).')
  process.exit(0)
}

const appDir = path.join(process.cwd(), 'src', 'app')

// Route groups / segments that depend on the backend API and must NOT ship in the
// public marketing deploy. Everything else (notably (marketing) and (public)) stays.
const REMOVE = ['(dashboard)', '(onboarding)', 'auth', 'login', 'api', 'close-server', 'session-expired']

let removed = 0
for (const entry of REMOVE) {
  const target = path.join(appDir, entry)
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true })
    console.log(`[marketing] removed src/app/${entry}`)
    removed++
  }
}

// Remove the auth-guard proxy/middleware (Next 16 calls it "proxy"). For non-cloud
// builds it redirects `/` -> `/login`, which makes no sense for the public marketing
// site and loops against the `/login` -> `/` redirect in next.config.
const srcDir = path.join(process.cwd(), 'src')
for (const mw of ['proxy.ts', 'proxy.js', 'middleware.ts', 'middleware.js']) {
  for (const dir of [srcDir, process.cwd()]) {
    const target = path.join(dir, mw)
    if (existsSync(target)) {
      rmSync(target, { force: true })
      console.log(`[marketing] removed ${path.relative(process.cwd(), target)}`)
      removed++
    }
  }
}

console.log(`[marketing] marketing-only tree ready (${removed} item(s) removed).`)
