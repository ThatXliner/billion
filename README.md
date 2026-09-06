# Billion

Billion helps people understand legislation, government decisions, and their ballot. The mobile app pairs source documents with readable explanations and citations. This repository contains the app, its web/API server, and the background jobs that collect and enrich civic data.

## Start here

1. Read the [architecture and code tour](docs/architecture.md) to understand the system and follow a bill from ingestion to the screen.
2. Follow [Contributing](CONTRIBUTING.md) to get a local database and development server running.
3. Use the [documentation index](docs/README.md) to find the guide for your first change.

For the product's purpose and voice, read the [brand manifesto](BRANDING.md).

## Run locally

Use Node `>=22.20.0` and pnpm `10.15.1`, the version pinned in `package.json`.

```bash
git clone https://github.com/billion-app/billion.git
cd billion
pnpm install
pnpm onboard
pnpm dev:next
```

Onboarding prepares local configuration and a database, with optional sample data and native setup. Open `http://localhost:3000` for the website. For mobile work, follow the [Expo setup steps](CONTRIBUTING.md#run-the-mobile-app), then use `pnpm dev` to run Expo alongside Next.js. Expo needs the Next.js server for its API.

## Repository map

| Directory             | Responsibility                                                             |
| --------------------- | -------------------------------------------------------------------------- |
| `apps/expo`           | Primary mobile client, built with React Native and Expo Router             |
| `apps/nextjs`         | Website, shared article pages, authentication endpoints, and tRPC API host |
| `apps/scraper`        | Fetches government records and generates explanations and artwork          |
| `apps/supervisor`     | Schedules and runs scraper jobs one at a time on the production host       |
| `packages/api`        | Typed API procedures and civic data integrations                           |
| `packages/db`         | PostgreSQL schema, migrations, and seeds                                   |
| `packages/auth`       | Better Auth configuration shared by web and mobile                         |
| `packages/env`        | Environment variable registry, validation, and setup wizard                |
| `packages/ui`         | Web components, native helpers, and shared theme tokens                    |
| `packages/validators` | Shared validation, including the structured bill brief                     |
| `tooling`             | Shared TypeScript, lint, formatting, and build configuration               |

Internal package names still use the template's `@acme/*` prefix. Use those names with `pnpm --filter`, for example `pnpm --filter @acme/api test`.

## Shipping and operations

- [iOS and OTA releases](docs/ios-release.md)
- [Scraper setup and commands](apps/scraper/README.md) and [production supervision](apps/supervisor/README.md)
- [Environment and launch configuration](docs/launch.md)
- [Troubleshooting](docs/troubleshooting.md)

Agent instructions live in [AGENTS.md](AGENTS.md). Developer documentation starts with [Contributing](CONTRIBUTING.md).
