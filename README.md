# vue-flow-test

A literary timeline builder sandbox using Vue 3, Pinia, Vue Flow, Hono, Drizzle, and SQLite.

## Stack

- **apps/web** — Vue 3 + Vite + Pinia + Vue Flow 1.48
- **apps/api** — Hono + Drizzle ORM + SQLite (WAL mode)
- **packages/shared** — Zod schemas and shared TypeScript types

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

```bash
pnpm install
# First-time only: allow native module builds (better-sqlite3, esbuild)
pnpm approve-builds --all
pnpm install
pnpm db:migrate
```

## Development

Run both apps in parallel:

```bash
pnpm dev
```

Or individually:

```bash
pnpm dev:api   # http://localhost:3000
pnpm dev:web   # http://localhost:5173
```

The web app proxies `/api/*` to the API server.

## Step 1 deliverables

- Monorepo scaffold with shared types
- Timeline CRUD API with graph JSON persistence
- Vue Flow editor with Pinia state and debounced autosave

## Step 2 deliverables

- Normalized tables: `users`, `media_items`, `timeline_nodes`, `timeline_edges`
- Extended `timelines` with `visibility`, `share_slug`, `viewport`, publish fields
- Save/load via normalized rows (with `graph_json` fallback for legacy data)
- Media deduplication by `external_ids` or title+type
- Filter endpoint: `GET /timelines/:id/nodes?type=book|movie|game`

Verify Step 2:

```bash
pnpm test:step2
```
