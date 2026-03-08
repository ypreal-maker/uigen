# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies, generate Prisma client, and run migrations
npm run setup

# Start dev server (Windows — use this instead of npm run dev)
set "NODE_OPTIONS=--require ./node-compat.cjs" && npx next dev --turbopack

# Run tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Reset the database
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate

# Create a new migration after schema changes
npx prisma migrate dev --name <migration-name>
```

> **Note:** `npm run dev` uses Linux-style single quotes and fails on Windows. Use the `set` command above directly.

## Architecture Overview

UIGen is a Next.js 15 (App Router) application that lets users generate React components via AI chat, with a live preview, Monaco code editor, and optional persistence for authenticated users.

### Request Flow

1. User types a message → `ChatContext` (wraps Vercel AI SDK `useChat`) sends POST to `/api/chat`
2. `/api/chat/route.ts` calls Claude (`claude-haiku-4-5`) with two tools: `str_replace_editor` and `file_manager`
3. Claude creates/modifies files in the virtual file system via tool calls (up to 40 steps)
4. `FileSystemContext` processes each tool call via `handleToolCall()`
5. Preview iframe reads the virtual FS, Babel-transforms JSX, and re-renders live
6. On completion, if authenticated, the project (messages + file state) is saved to SQLite via Prisma

### Key Abstractions

**Virtual File System** (`src/lib/file-system.ts`)
- In-memory tree; no disk writes. Serialized to/from JSON for DB persistence.
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) is the React interface to it.

**AI Tools** (`src/lib/tools/`)
- `str_replace_editor`: view/create/edit file content (used most)
- `file_manager`: rename/delete files

**Preview** (`src/components/preview/PreviewFrame.tsx`)
- Sandboxed iframe; Babel standalone transforms JSX client-side; imports resolved via `esm.sh` CDN import map.
- Entry point auto-detected: `/App.jsx` → `/App.tsx` → `/index.jsx` → `/index.tsx`

**AI Provider** (`src/lib/provider.ts`)
- Real Claude if `ANTHROPIC_API_KEY` is set in `.env`; otherwise falls back to a `MockLanguageModel` that generates static example components.

**Auth** (`src/lib/auth.ts`, `src/actions/index.ts`)
- JWT in httpOnly cookie (7-day expiry, HS256). Password hashed with bcrypt (cost 10).
- Middleware at `src/middleware.ts` protects `/api/projects` and `/api/filesystem`.
- Server actions: `signUp`, `signIn`, `signOut`, `getUser`.

### Database

SQLite via Prisma. Schema in `prisma/schema.prisma`.

- `User`: email + hashed password
- `Project`: belongs to User; stores `messages` (JSON string) and `data` (serialized virtual FS as JSON string)

Anonymous users have no persistence — their work is lost on refresh.

### State Management

Two primary React contexts (in `src/lib/contexts/`):
- `FileSystemContext` — virtual FS state, selected file, tool call processing
- `ChatContext` — wraps `useChat`, connects AI responses to `FileSystemContext`

### System Prompt

`src/lib/prompts/generation.tsx` instructs Claude to:
- Write React components with Tailwind CSS
- Use `@/` import alias
- Always create `/App.jsx` as the root entrypoint

## Code Style

- Use comments sparingly. Only comment complex code.
