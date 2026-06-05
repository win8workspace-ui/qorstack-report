# Changelog

All notable changes to Qorstack Report are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/),
and the project aims to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `mcp/` — Model Context Protocol server exposing `qorstack_list_templates`,
  `qorstack_get_template`, `qorstack_generate_pdf`, `qorstack_generate_excel`, and
  `qorstack_get_job` tools, so MCP-capable agents can drive Qorstack natively.
- `AGENTS.md` and `llms.txt` — agent-facing quickstart and integration guide,
  including explicit guidance on when to use Qorstack vs. calling Gotenberg directly.
- `make init` / `selfhost/init.sh` — generate a `.env` with cryptographically random
  secrets (no `change-me` defaults), printing the generated admin password.
- `make verify` / `selfhost/verify.sh` — smoke-test that a running stack is serving
  (API `/health` + web UI), compose-agnostic.
- `make docker-buildx` — multi-arch image publishing (linux/amd64 + linux/arm64)
  so images run natively on Apple Silicon as well as Intel. Per-service targets
  (`docker-buildx-web`, `docker-buildx-api`) publish a single changed service.
- `versions.mk` — single source of truth for per-service image tags
  (`REPORT_API_TAG` / `REPORT_WEB_TAG` / `GOTENBERG_TAG`); the Makefile reads it
  so tags need not be typed on the command line, and publishing a tag also
  re-tags `:latest`.
- Image tags in the self-host compose are now overridable via `REPORT_API_TAG` /
  `REPORT_WEB_TAG` (default `latest`) for reproducible, pinned deploys.

### Changed (reliability)

- The web UI container now waits for the API to be healthy (`depends_on:
  condition: service_healthy`) instead of merely started.

### Changed

- Self-host docs/site now reflect the self-hosted-only model (there is no hosted
  cloud — `api.qorstack.dev` / `cdn.qorstack.dev` no longer exist): removed the
  dead "Managed Service / Cloud API" marketing section, relabelled the "Cloud API"
  roadmap item to "REST API", and switched docs/demo example URLs to the local
  `localhost` defaults.
- Landing-page "Open Dashboard" CTA now links to the docs in cloud/marketing mode.
- `font-syncer` polling interval relaxed from 5s to 30s to reduce idle CPU use.
- Removed the unused `LICENSE=free` variable from the self-host `.env.example`
  (the published image ignores it; Pro is activated via a signed license file).
- OSS sync (`make sync`) now commits incrementally on top of the public repo's
  history instead of force-pushing a fresh orphan commit each time.
