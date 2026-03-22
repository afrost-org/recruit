# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Job application system: React SPA frontend + Cloudflare Pages Functions backend. Candidates browse jobs and submit applications with resumes; recruiters get Google Chat notifications.

## Commands

- **Dev server**: `yarn dev` (Vite dev server)
- **Build**: `yarn build` (TypeScript check + Vite build)
- **Lint**: `yarn lint` (ESLint)
- **Deploy**: `npx wrangler pages deploy dist`
- **Local with CF bindings**: `npx wrangler pages dev dist` (after build)

Package manager is **yarn** (v1).

## Architecture

**Frontend** (`src/`): React 18 + TypeScript + Vite. Uses react-router-dom with two routes:
- `/` → `HomePage` (job listings)
- `/jobs/:jobId` → `JobPage` (job details + application form)

UI built with shadcn/ui components (`src/components/ui/`) + Tailwind CSS. Path alias `@/` maps to `src/`.

Job data lives in `src/data/jobs.json`. Types in `src/types/job.ts`.

**Backend** (`functions/`): Cloudflare Pages Functions (plain JS, not TypeScript):
- `functions/submit.js` — `POST /submit`: accepts multipart form data (application + resume), stores in KV + R2, sends Telegram notification
- `functions/getResume.js` — `GET /getResume`: retrieves resume files from R2

**Storage**: Cloudflare KV for application records, R2 for resume files. Bindings configured in `wrangler.toml`.

**Environment variables** (set in `.dev.vars` for local, `wrangler.toml` for prod):
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `R2_PUBLIC_URL`
