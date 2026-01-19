# Contributing guide

These instructions (5a and 5b) were also originally copy-pasted from https://github.com/t3-oss/create-t3-turbo

### 5a. When it's time to add a new UI component

Run the `ui-add` script to add a new UI component using the interactive `shadcn/ui` CLI:

```bash
pnpm ui-add
```

When the component(s) has been installed, you should be good to go and start using it in your app.

### 5b. When it's time to add a new package

To add a new package, simply run `pnpm turbo gen init` in the monorepo root. This will prompt you for a package name as well as if you want to install any dependencies to the new package (of course you can also do this yourself later).

The generator sets up the `package.json`, `tsconfig.json` and a `index.ts`, as well as configures all the necessary configurations for tooling around your package such as formatting, linting and typechecking. When the package is created, you're ready to go build out the package.

## Expo App Styling

All styling in the Expo app is consolidated into a single location: `apps/expo/src/styles.ts` (although more work is on the way to further consolidate it into the ui package?)

**Import everything from `~/styles`** - no need to import from `@acme/ui/theme-tokens` directly.

### What's Available

```tsx
import {
  // Theme hook
  useTheme,        // Returns { theme, colorScheme, isDark }
  type Theme,      // Type for theme object

  // Re-exported from theme-tokens
  colors,          // Color palette (colors.cyan[600], colors.purple[500], etc.)
  darkTheme,       // Dark mode semantic colors
  lightTheme,      // Light mode semantic colors
  fontSize,        // Font sizes (fontSize.base, fontSize.xl, etc.)
  fontWeight,      // Font weights (fontWeight.bold, fontWeight.medium, etc.)
  spacing,         // Spacing scale in rem
  radius,          // Border radius scale in rem
  shadows,         // Shadow presets for light/dark modes

  // Pixel conversion helpers
  sp,              // sp[5] → spacing[5] * 16 → 20px
  rd,              // rd("lg") → radius.lg * 16 → 12px

  // Pre-built StyleSheet objects
  layout,          // container, fullCenter, row, center, etc.
  typography,      // h1, h2, h3, h4, body, bodySmall, caption, bold, etc.
  cards,           // base, bordered, elevated, content
  buttons,         // tab, tabText, floating, floatingLarge
  badges,          // base, text
  settings,        // section, sectionTitle, item, itemTitle, etc.
  actions,         // container, button, icon, text (for like/comment/share)

  // Helper functions
  getMarkdownStyles,       // getMarkdownStyles(theme) → Markdown component styles
  getTypeBadgeColor,       // getTypeBadgeColor("bill") → purple color
  createHeaderStyles,      // createHeaderStyles(theme, insetTop) → header styles
  createSearchStyles,      // createSearchStyles(theme) → search input styles
  createTabContainerStyles, // createTabContainerStyles(theme) → tab bar styles
  getShadow,               // getShadow("md", isDark) → shadow style object
} from "~/styles";
```

### Usage Example

```tsx
import { Text, View } from "~/components/Themed";
import { layout, typography, cards, sp, useTheme } from "~/styles";

export default function MyScreen() {
  const { theme } = useTheme();

  return (
    <View style={[layout.container, { backgroundColor: theme.background }]}>
      <Text style={[typography.h1, { color: theme.foreground }]}>
        Hello World
      </Text>
      <View style={[cards.bordered, { marginTop: sp[4], backgroundColor: theme.card }]}>
        <Text style={[typography.body, { color: theme.textSecondary }]}>
          Card content
        </Text>
      </View>
    </View>
  );
}
```

### The `sp()` and `rd()` Functions

The spacing and radius tokens in `theme-tokens.ts` are defined in rem units (for web compatibility). The `sp()` and `rd()` helpers convert them to pixels for React Native:

```tsx
// spacing tokens are rem values
spacing[5] = 1.25  // 1.25rem

// sp() multiplies by 16 to get pixels
sp[5] = 1.25 * 16 = 20  // 20px

// Same for radius
radius.lg = 0.75  // 0.75rem
rd("lg") = 0.75 * 16 = 12  // 12px
```

## Architecture

(slightly outdated as of 2026-01-05)

```text
.github
  └─ workflows
        └─ CI with pnpm cache setup
.vscode
  └─ Recommended extensions and settings for VSCode users
apps
  ├─ expo
  │   ├─ Expo SDK 54
  │   ├─ React Native 0.81 using React 19
  │   ├─ Navigation using Expo Router
  │   ├─ Tailwind CSS v4 using NativeWind v5
  │   └─ Typesafe API calls using tRPC
  └─ next.js
      ├─ Next.js 15
      ├─ React 19
      ├─ Tailwind CSS v4
      └─ E2E Typesafe API Server & Client
packages
  ├─ api
  │   └─ tRPC v11 router definition
  ├─ auth
  │   └─ Authentication using better-auth.
  ├─ db
  │   └─ Typesafe db calls using Drizzle & Supabase
  └─ ui
      └─ Start of a UI package for the webapp using shadcn-ui
tooling
  ├─ eslint
  │   └─ shared, fine-grained, eslint presets
  ├─ prettier
  │   └─ shared prettier configuration
  ├─ tailwind
  │   └─ shared tailwind theme and configuration
  └─ typescript
      └─ shared tsconfig you can extend from
```

I'm not sure how accurate this data flow diagram is (generated by Claude).

```
---
📊 Data Flow: Source → Database → API → App

┌─────────────────┐
│  Source Sites   │
│  ├─ GovTrack    │
│  ├─ WhiteHouse  │
│  └─ Congress    │
└────────┬────────┘
         │ Playwright/Crawlee
         │ (Headless Browser)
         ▼
┌─────────────────┐
│   Scrapers      │
│  ├─ govtrack.ts │
│  ├─ whitehouse  │
│  └─ congress.ts │
└────────┬────────┘
         │ upsert functions
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  ├─ bill        │
│  ├─ pres_action │
│  └─ court_case  │
└────────┬────────┘
         │ Drizzle ORM
         ▼
┌─────────────────┐
│  tRPC Router    │
│  content.ts     │
└────────┬────────┘
         │ Type-safe API
         ▼
┌─────────────────┐
│  Mobile/Web App │
│  (Expo/Next.js) │
└─────────────────┘
```
