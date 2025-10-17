# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Billion is an AI-powered mobile app for the Congressional App Challenge 2025 that makes political information accessible through TikTok-style short-form content. The app transforms complex political topics (laws, bills, orders, cases) into digestible video content with cross-spectrum analysis.

This is a T3 Turborepo monorepo with a React Native (Expo) mobile app and a Next.js web application, sharing backend logic through tRPC.

## Monorepo Structure

The repository uses Turborepo with pnpm workspaces and follows the `@acme` namespace convention:

- **apps/expo**: React Native mobile app using Expo SDK 53, React 19, Expo Router, NativeWind (Tailwind)
- **apps/nextjs**: Next.js 15 web app with React 19 and Tailwind CSS
- **packages/api**: tRPC v11 router definitions (production dep for Next.js, dev dep for Expo)
- **packages/auth**: Better Auth authentication setup (OAuth proxy support)
- **packages/db**: Drizzle ORM with Supabase/Vercel Postgres (edge-bound)
- **packages/ui**: shadcn/ui components for web
- **packages/validators**: Shared validation schemas
- **tooling/**: Shared configs for eslint, prettier, tailwind, and typescript

## Development Commands

### Initial Setup

```bash
# Install dependencies
pnpm i

# Setup environment variables
cp .env.example .env
# Edit .env with your POSTGRES_URL, AUTH_SECRET, and OAuth credentials

# Generate Better Auth schema (REQUIRED before first run)
pnpm auth:generate

# Push database schema
pnpm db:push
```

### Daily Development

```bash
# Start all apps in watch mode (Expo + Next.js)
pnpm dev

# Start only Next.js (useful for backend work)
pnpm dev:next

# Start Expo on iOS simulator
pnpm dev  # Then configure apps/expo/package.json "dev" script to "expo start --ios"

# Start Expo on Android emulator
pnpm dev  # Then configure apps/expo/package.json "dev" script to "expo start --android"
```

### Database Operations

```bash
# Push schema changes to database
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Code Quality

```bash
# Type checking across all packages
pnpm typecheck

# Lint all packages
pnpm lint
pnpm lint:fix

# Format all code
pnpm format
pnpm format:fix

# Check workspace dependencies
pnpm lint:ws
```

### Adding Components/Packages

```bash
# Add shadcn/ui component (interactive CLI)
pnpm ui-add

# Generate new package scaffold
pnpm turbo gen init
```

## Architecture Notes

### Authentication (Better Auth)

- Configuration files:
  - Runtime: `packages/auth/src/index.ts`
  - CLI-only (for schema generation): `packages/auth/script/auth-cli.ts`
- The CLI config is isolated in `script/` to prevent accidental imports
- Generated schema: `packages/db/src/auth-schema.ts`
- Uses OAuth proxy plugin for Expo development (deployed Next.js app forwards auth requests)
- Alternative: Add local IP to OAuth provider (less reliable)

### Database (Drizzle + Supabase)

- Edge-bound with Vercel Postgres driver
- Schema: `packages/db/src/schema.ts`
- Client: `packages/db/src/index.ts`
- To switch to non-edge: Remove `export const runtime = "edge"` from Next.js pages/routes

### tRPC API

- Root router: `packages/api/src/root.ts`
- Router modules: `packages/api/src/router/`
- Type safety between Next.js (server) and Expo (client) via `AppRouter` type
- Expo imports `@acme/api` as devDependency (types only, no backend code leakage)

### Expo App Structure

- Uses Expo Router for navigation (file-based routing)
- Layout hierarchy:
  - `apps/expo/src/app/_layout.tsx`: Root layout with providers, status bar
  - `apps/expo/src/app/(tabs)/_layout.tsx`: Tab navigation layout
  - Tab screens: `(tabs)/index.tsx` (Browse), `(tabs)/feed.tsx`, `(tabs)/settings.tsx`
- Styling: NativeWind (Tailwind classes for React Native)
- Header configuration: Set `headerShown: false` in layouts to use custom headers

### Styling Notes for Expo

- The root layout (`_layout.tsx`) controls global header visibility via Stack's `screenOptions`
- Tab layouts can override header settings per screen
- Custom headers should account for safe area insets: `useSafeAreaInsets()` from `react-native-safe-area-context`
- Some Tailwind classes (e.g., `rounded-*`) may not work consistently; use inline `style={{ borderRadius: X }}` as fallback

## Environment Variables

Required variables (see `.env.example`):

- `POSTGRES_URL`: Supabase connection string
- `AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET`: OAuth provider credentials
- `AUTH_REDIRECT_PROXY_URL`: For Better Auth proxy (production Next.js URL)

## Node/PNPM Requirements

- Node: >=22.19.0
- pnpm: >=10.15.1

## Deployment

### Next.js (Vercel)

1. Deploy `apps/nextjs` folder as root directory
2. Add `POSTGRES_URL` environment variable
3. Vercel auto-configures Turborepo builds

### Expo (App Stores)

1. Update `getBaseUrl()` in `apps/expo/src/utils/api.tsx` to point to production Next.js URL
2. Use EAS CLI for builds/submissions:
   ```bash
   pnpm add -g eas-cli
   eas login
   cd apps/expo
   eas build:configure
   eas build --platform ios --profile production
   eas submit --platform ios --latest
   ```

## Troubleshooting

- **Dependency issues**: Add `node-linker=hoisted` to `.npmrc` in project root
- **XCode simulator**: Manually open simulator once after install/update before running `pnpm dev`
- **OAuth in Expo**: Deploy Next.js app first to use auth proxy, or add local IP to OAuth provider
