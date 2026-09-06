# Troubleshooting

Start from the failing layer: process startup, database, API connection, then the screen. [Contributing](../CONTRIBUTING.md) contains the supported setup path.

## The website will not start

Run `pnpm env:doctor --target nextjs --file .env` and inspect the startup error. Next.js validates server settings and public PostHog settings. Fix the relevant declaration or local value rather than bypassing validation. Root `.env.local` may override a value you just changed in `.env`; see [loading policy](launch.md#loading-policy).

If `pnpm dev` fails on Windows with an invalid package filter, use `pnpm dev:next` for the API and run `pnpm --filter @acme/expo dev` in another terminal. The root script uses quoted exclusion filters that some shells handle differently.

## Database errors or empty content

Confirm that `POSTGRES_URL` selects the intended local database and that the service is running. For Docker, use `pnpm postgres:status` and `pnpm postgres:logs`. Do not print the connection string into a shared log.

A new database needs a schema and sample data before Browse can display articles. Onboarding offers both. For migration-managed databases, follow [Migrations](data-layer.md#migrations); do not use baselining to hide a missing table.

## Mobile cannot reach the API

1. Start Next.js with `pnpm dev:next` or `pnpm dev` and check it on your computer at port `3000`.
2. Check `apps/expo/.env.local`. The committed Expo `.env` points to production, so local development needs an override.
3. From a phone, use the computer's reachable LAN address or [a tunnel](localtunnel.md). `localhost` on a physical phone is the phone itself.
4. Restart Expo after changing `EXPO_PUBLIC_API_URL`. If stale bundler state remains, run `pnpm --filter @acme/expo exec expo start --clear`.

For localtunnel, open its URL in a browser and pass any interstitial page first. Keep the tunnel process running. A tunnel serving HTML instead of an API response can look like a CORS or parsing failure.

## Authentication fails

Check `BETTER_AUTH_SECRET`, the API URL, and the auth callback host. `AUTH_SECRET` is an obsolete name here. The mobile request must carry the cookie returned by the Expo auth client; the server must resolve it in `createTRPCContext`.

For OAuth, inspect the configured provider callback and trusted origins in `packages/auth/src/index.ts`. A successful website response alone does not verify the native callback and stored session. See [Frontend authentication](frontend.md#authentication).

## No development build or missing native module

Errors such as `No development build ... is installed`, `Cannot find native module`, or a native/JavaScript version mismatch require a native build:

```bash
pnpm ios
# Or:
pnpm android
```

Run those commands from the repository root. A clean Expo prebuild generates native project files; it does not install a compiled app. Restarting Metro cannot add a missing native module to the binary.

When using Xcode, open `apps/expo/ios/billion.xcworkspace` so CocoaPods dependencies are included.

## Metro or Expo package mismatch

Compare installed packages with `apps/expo/package.json` and the overrides in `pnpm-workspace.yaml`. Older docs referred to Expo 53 and pinned Metro versions from that SDK; those are not the current compatibility targets. Restore the committed dependency resolution with `pnpm install --frozen-lockfile` before investigating an upgrade. Rebuild the development binary when native dependencies changed.

## Missing declarations or `.js` extension errors

Some workspace packages export generated declarations from `dist/`. A fresh checkout or worktree may lack them, so an isolated package check can resolve source under a different module mode and report `TS2835` or missing declarations.

Build the database and its workspace dependencies from the root, then repeat the failing check:

```bash
pnpm exec turbo run build --filter=@acme/db...
```

Use the dependency's actual package name if the error points elsewhere. Give each worktree its own install; linking another checkout's `node_modules` can also break mobile release fingerprints.

## Development and production tabs differ

Settings is intentionally hidden outside development, and Feed is hidden in both modes. Check `apps/expo/src/app/(tabs)/_layout.tsx` and the custom `TabBar` when a visibility change does not take effect. Verify the production bundle for changes involving `__DEV__`.
