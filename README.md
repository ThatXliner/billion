# Billion

Billion helps people understand legislation, government decisions, and their ballot. The mobile app pairs source documents with readable explanations and citations. This repository contains the app, its web/API server, and the background jobs that collect and enrich civic data.

## First-time setup

Follow these sections in order for a new checkout. Run commands from the repository root unless a step says otherwise. The mobile app uses a native development build on iOS or Android, so the first build is separate from the daily JavaScript development loop.

**Run `pnpm ios` or `pnpm android` for your platform before your first `pnpm dev` session.**

### 1. Install prerequisites

Install:

- Node `>=22.20.0` and pnpm `10.15.1`, the versions pinned in `package.json`.
- Git.
- PostgreSQL through [Postgres.app](https://postgresapp.com/), Homebrew, or Docker. If you use Docker's PostgreSQL service, install Docker Desktop and start it before onboarding.

iOS development requires macOS and Xcode. Android development requires Android Studio, its SDK and emulator, and Java 17. Choose your platform below.

### 2. Prepare native build tools

#### iOS: Xcode and Simulator

Xcode is Apple's build tool for iOS. The iOS Simulator is a virtual iPhone. You can keep writing code in your existing editor; Xcode builds, installs, and runs the app.

1. Install the full Xcode app from the Mac App Store.
2. Launch Xcode, accept its license, and let it install any requested components.
3. In **Xcode > Settings > Locations**, set **Command Line Tools** to the installed Xcode version.
4. In **Xcode > Settings > Components** (called **Platforms** in older versions), install an iOS Simulator runtime.
5. Open **Xcode > Open Developer Tool > Simulator**. In Simulator, choose **File > Open Simulator** and select an iPhone.

See Expo's [iOS Simulator guide](https://docs.expo.dev/workflow/ios-simulator/) for screenshots.

#### Android: Android Studio and emulator

Follow [the Android setup guide](docs/android-release.md#local-setup-on-this-mac) to install Android Studio and Java 17 through Homebrew, configure the SDK and shell environment, and create the `Billion_API_36_16KB` emulator. It includes the exact SDK packages and the Gradle memory setting needed for release builds. Xcode is not required for Android.

After that setup, open a new terminal and verify the tools:

```bash
java -version
adb version
emulator -list-avds
```

Start the configured emulator from Android Studio's Device Manager or the terminal:

```bash
emulator -avd Billion_API_36_16KB &
```

The [Android guide](docs/android-release.md) also covers standalone APK previews and the Google Play release checklist.

### 3. Clone and install the repository

Run these commands from the directory where you keep projects:

```bash
git clone https://github.com/billion-app/billion.git
cd billion
pnpm install
pnpm onboard
```

`pnpm onboard` opens a setup wizard. It creates local configuration, chooses a local database, offers to apply the schema and seed sample content, and can configure providers, generate native files, and run a typecheck. Choose sample data when the wizard offers it so the app has articles to display. Native prebuild is optional and generates project files; it does not install the development app.

For a website/API-only checkout, use `pnpm onboard --skip-expo` instead.

### 4. Configure Next.js and the local data

Onboarding explains environment variables and keeps secrets masked. You can rerun the Next.js environment setup and validation with:

```bash
pnpm env:setup --target nextjs --file .env
pnpm env:doctor --target nextjs --file .env
```

Next.js requires the public PostHog settings. Civic and Places have development mocks when provider keys are absent, but those mocks cover only those providers; other integrations may still need credentials. Root `.env.local` overrides root `.env`, so check it when a changed value seems ignored.

### 5. Set Expo's local API URL

Expo's production default lives in `apps/expo/.env`. Create `apps/expo/.env.local` to override it for local development. Use the URL for your simulator or emulator:

iOS Simulator:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Android emulator (`10.0.2.2` maps to the host computer's localhost):

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

For a physical phone, replace `localhost` or `10.0.2.2` with your Mac's LAN IP. On macOS, find it at **System Settings > Wi-Fi > Details > TCP/IP > IP Address**. Keep the phone and Mac on the same network. If the phone cannot reach the Mac, use the [local tunnel guide](docs/localtunnel.md). Restart Expo after changing this value.

### 6. Build and install the development app once

Open your iOS Simulator or Android emulator first. From the repository root, run the command for your platform:

```bash
pnpm ios      # iOS
pnpm android  # Android
```

This compiles and installs Billion's development app and its native dependencies; Expo Go is not sufficient for this app. Wait for the first build to finish. If the command leaves a bundler running after the app installs, press `Ctrl+C`, then continue with the daily command below so you do not start two bundlers on the same port.

Rerun `pnpm ios` or `pnpm android` after adding native dependencies, changing native configuration, or deleting the installed app. Native configuration changes may also require regenerating native files before the rebuild. Normal JavaScript changes reload through Metro.

### 7. Start daily development

From the repository root, run:

```bash
pnpm dev
```

This starts Expo's Metro JavaScript bundler and the Next.js API. In Turbo's terminal UI, select `@acme/expo` and press `i` for iOS or `a` for Android to open the installed app.

If you need separate terminals, run `pnpm dev:next` in one terminal and `pnpm --filter @acme/expo dev` in another, then press `i` or `a` in the Expo terminal.

`pnpm dev` excludes the scraper and supervisor. `pnpm dev:all` starts those background jobs, which can write durable data and invoke paid providers. For a bounded ingestion run, use the [scraper guide](apps/scraper/README.md).

### Website/API-only development

Use `pnpm onboard --skip-expo` during setup, then start the website and API with:

```bash
pnpm dev:next
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Troubleshooting

| Symptom                                   | Fix                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Development build is missing              | Open your simulator/emulator and run `pnpm ios` or `pnpm android`. Expo Go cannot replace the development build.                                                         |
| No simulator appears                      | Install an iOS Simulator runtime in **Xcode > Settings > Components** (or **Platforms** on older Xcode versions).                                                        |
| The wrong command-line tools are selected | In **Xcode > Settings > Locations**, set **Command Line Tools** to the installed Xcode.                                                                                  |
| There is no data or API requests fail     | Keep Next.js running at the URL in `EXPO_PUBLIC_API_URL`, restart Expo after changing the env file, and choose sample data during onboarding or seed the local database. |

Once the app works, read the [architecture and code tour](docs/architecture.md) to follow a bill from ingestion to the screen. For guidance on making and checking your first change, see [Contributing](CONTRIBUTING.md). The [documentation index](docs/README.md) links to specialist guides.

For the product's purpose and voice, read the [brand manifesto](BRANDING.md).

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
- [Android setup, standalone previews, and Google Play releases](docs/android-release.md)
- [Scraper setup and commands](apps/scraper/README.md) and [production supervision](apps/supervisor/README.md)
- [Environment and launch configuration](docs/launch.md)
- [Troubleshooting](docs/troubleshooting.md)

Agent instructions live in [AGENTS.md](AGENTS.md). Contributor setup is above; [Contributing](CONTRIBUTING.md) covers making and checking changes.
