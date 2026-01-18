# Billion - Brand Guidelines

**"Deep State Modern"** - A Futuristic Civic Tech Aesthetic

---

## Overview

Billion's visual identity embodies the intersection of civic engagement and modern technology. Our design language balances authoritative government aesthetics with cutting-edge digital interfaces, creating a premium experience that makes complex political content accessible and engaging.

## Design Philosophy

**Dark Mode First**: The app is designed primarily for dark mode, with deep indigo backgrounds that convey sophistication and focus.

**Glassmorphism**: Semi-transparent surfaces with subtle borders create depth and visual hierarchy without overwhelming content.

**Gradient Accents**: Purple-to-cyan gradients represent the spectrum of civic discourse and add visual interest to key interactions.

---

## Color Palette

### Primary Colors

#### Deep Indigo
The foundation of our visual identity. Used for backgrounds and establishing the app's sophisticated atmosphere.

- **900**: `#1a1a40` - Primary background
- **800**: `#3730a3` - Elevated surfaces
- **700**: `#4338ca` - Interactive elements
- **600**: `#4f46e5` - Hover states
- **500**: `#6366f1` - Active elements

**Usage**: Backgrounds, containers, base surfaces

---

#### Purple (Brand Primary)
Our primary action color. Represents civic engagement and forward-thinking governance.

- **700**: `#7928ca` - Vibrant accent
- **600**: `#9333ea` - Primary buttons
- **500**: `#a855f7` - Hover states
- **400**: `#c084fc` - Disabled states

**Usage**: Primary buttons, active states, call-to-action elements, gradient starts

---

#### Cyan (Electric Accent)
High-energy accent color for emphasis and visual interest.

- **600**: `#0891b2` - Badges, tags
- **500**: `#06b6d4` - Links, accents
- **400**: `#22d3ee` - Interactive highlights
- **300**: `#67e8f9` - Subtle highlights

**Usage**: Links, borders, accent highlights, gradient ends, type badges

---

### Supporting Colors

#### Lavender (Secondary Text)
Softer text color for secondary information without sacrificing readability.

- **500**: `#b0b0d1` - Secondary text
- **400**: `#c4b5fd` - Muted elements

**Usage**: Secondary text, captions, metadata, timestamps

---

#### Navy (Glass Surfaces)
Dark translucent surfaces that create the glassmorphism effect.

- **700**: `#1e1e4f` - Dark glass cards
- **600**: `#252560` - Elevated glass
- **500**: `#2d2d6b` - Medium surfaces

**Usage**: Content cards, elevated panels, modal backgrounds

---

### Semantic Colors

#### Success Green
- **600**: `#16a34a` (Light mode)
- **500**: `#10b981` (Dark mode)

#### Warning Orange
- **500**: `#f97316`

#### Error Red
- **600**: `#dc2626` (Light mode)
- **500**: `#ef4444` (Dark mode)

---

## Typography

### Hierarchy

**Display Text** (Titles, Headers)
- Size: 30-48px
- Weight: Bold (700)
- Color: White (`#ffffff`) in dark mode
- Line Height: 1.2x
- Usage: Screen titles, card headlines

**Body Text** (Primary Content)
- Size: 16px
- Weight: Regular (400) / Medium (500)
- Color: White (`#ffffff`) in dark mode
- Line Height: 1.5x
- Usage: Article content, descriptions

**Secondary Text** (Supporting Info)
- Size: 14px
- Weight: Regular (400) / Medium (500)
- Color: Lavender (`#b0b0d1`) in dark mode
- Line Height: 1.4x
- Usage: Metadata, timestamps, captions

**Small Text** (Labels, Tags)
- Size: 12px
- Weight: Semibold (600)
- Color: White or Lavender
- Letter Spacing: 0.5px
- Usage: Badges, labels, fine print

---

## Components

### Buttons

#### Primary Button
- **Background**: Purple gradient (`#9333ea`)
- **Text**: White
- **Border**: None
- **Shadow**: Dramatic shadow with indigo glow
- **Hover**: Slightly lighter purple
- **Press**: Scale 0.98, opacity 0.9

**Usage**: Primary actions like "Watch Short", "Read Full Article"

#### Secondary Button (Outline)
- **Background**: Transparent
- **Text**: Foreground color
- **Border**: 1px cyan/border color
- **Shadow**: None
- **Hover**: Subtle background tint

**Usage**: Secondary actions like "Read More"

#### Ghost Button
- **Background**: Transparent
- **Text**: Cyan accent
- **Border**: None
- **Hover**: Subtle accent background (20% opacity)

**Usage**: Tertiary actions, navigation

---

### Cards

#### Content Card (Dark Glass)
- **Background**: Navy 700 (`#1e1e4f`)
- **Border**: 1px cyan/border color
- **Border Radius**: 16px (large)
- **Shadow**: Dramatic depth with indigo glow
- **Padding**: 24px

**Usage**: Article previews, feed items, content containers

#### Elevated Card
- **Background**: Theme card color
- **Border**: 1px border color
- **Border Radius**: 12px (medium)
- **Shadow**: Medium elevation
- **Padding**: 16-20px

**Usage**: Settings sections, list items

---

### Type Badges

Visual indicators for content type with distinct colors:

- **BILL**: Purple (`#9333ea`)
- **ORDER**: Indigo (`#4f46e5`)
- **CASE**: Cyan (`#0891b2`)
- **GENERAL**: Muted gray

**Style**:
- Border Radius: 8px
- Padding: 4px 12px
- Text: White, 12px, bold, uppercase
- Letter Spacing: 0.5px

---

### Navigation

#### Tab Pills (Browse Screen)
- **Active**: Purple background, white text
- **Inactive**: Transparent background, 1px border, muted text
- **Border Radius**: 8px
- **Padding**: 6px 12px

#### Tab Switcher (Article Screen)
- Uses Button component
- **Active**: Primary button style
- **Inactive**: Ghost button style

---

### Inputs

#### Search Input
- **Background**: Input background color (dark)
- **Border**: 1px border color (cyan tint)
- **Border Radius**: 12px
- **Padding**: 12px 16px
- **Placeholder**: Muted foreground color
- **Focus**: Cyan ring

---

## Shadows & Elevation

### Shadow System

**Small (sm)**
```
shadowColor: #000000
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.75
shadowRadius: 14
+ glow: rgba(99, 102, 241, 0.25)
```

**Medium (md)**
```
shadowColor: #000000
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.85
shadowRadius: 24
+ glow: rgba(99, 102, 241, 0.35)
```

**Large (lg)** (for cards)
```
shadowColor: #000000
shadowOffset: { width: 0, height: 12 }
shadowOpacity: 0.9
shadowRadius: 32
+ glow: rgba(99, 102, 241, 0.4)
```

**Usage**: Shadows create dramatic depth and include a subtle indigo glow to reinforce the brand's futuristic aesthetic.

---

## Spacing Scale

Based on 16px base unit:

- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 12px (0.75rem)
- **base**: 16px (1rem)
- **lg**: 20px (1.25rem)
- **xl**: 24px (1.5rem)
- **2xl**: 32px (2rem)
- **3xl**: 48px (3rem)

**Usage**: Consistent spacing creates visual rhythm and improves scannability.

---

## Border Radius

- **sm**: 6px - Small elements, badges
- **md**: 8px - Buttons, inputs
- **lg**: 12px - Cards, containers
- **xl**: 16px - Large cards, modals
- **full**: Circle - Floating action buttons, avatars

---

## Dark Mode (Primary Theme)

### Background Hierarchy
1. **Base Background**: Indigo 900 (`#1a1a40`)
2. **Elevated Surface**: Navy 700 (`#1e1e4f`)
3. **Highest Surface**: Navy 600 (`#252560`)

### Text Hierarchy
1. **Primary Text**: White (`#ffffff`)
2. **Secondary Text**: Lavender 500 (`#b0b0d1`)
3. **Muted Text**: Muted foreground

### Borders & Dividers
- **Primary Borders**: Cyan 800 (`#0e7490`)
- **Subtle Dividers**: Border color from theme

---

## Light Mode (Secondary Support)

While the app is designed dark-mode-first, light mode is supported:

### Background Hierarchy
1. **Base Background**: Indigo 50 (`#eef2ff`)
2. **Surface**: White (`#ffffff`)
3. **Elevated**: Indigo 100

### Text Hierarchy
1. **Primary Text**: Indigo 900 (`#1a1a40`)
2. **Secondary Text**: Lavender 700
3. **Muted Text**: Muted foreground

---

## Iconography

### Style
- Use simple, line-based icons
- 24px standard size for UI icons
- White or theme foreground color
- 2px stroke weight

### Floating Action Buttons
- **Size**: 56x56px circle
- **Background**: Purple primary
- **Icon**: White, 24px
- **Shadow**: Large elevation with glow
- **Position**: Bottom-right with 40px margin

---

## Motion & Interaction

### Press States
- **Scale**: 0.98
- **Opacity**: 0.9
- **Duration**: Instant (no animation delay)

### Hover States (Web)
- Subtle background tint or brightness increase
- Smooth transition: 150ms ease

### Loading States
- **Spinner**: Primary purple color
- **Size**: Large (default) or medium
- **Text**: Secondary text color, 16px

---

## Content Type Colors

Distinct colors help users quickly identify content types:

| Type | Color | Hex |
|------|-------|-----|
| **Bill** | Purple | `#9333ea` |
| **Order** | Indigo | `#4f46e5` |
| **Case** | Cyan | `#0891b2` |
| **General** | Muted | Theme muted |

---

## Accessibility

### Contrast Ratios
- **Primary text on dark background**: 21:1 (AAA)
- **Secondary text on dark background**: 8.5:1 (AA Large)
- **Interactive elements**: Minimum 3:1

### Focus States
- Visible cyan ring on all interactive elements
- 2px ring with theme ring color
- Never remove focus indicators

### Touch Targets
- Minimum: 44x44px
- Recommended: 48x48px or larger
- Adequate spacing between targets

---

## Implementation Notes

### Theme Tokens
All colors, spacing, and typography are defined in:
- `/packages/ui/src/theme-tokens.ts` (React Native)
- `/tooling/tailwind/theme.css` (Web)

### Dynamic Theming
Components use `useColorScheme()` hook and select appropriate theme:
```typescript
const colorScheme = useColorScheme();
const theme = colorScheme === "dark" ? darkTheme : lightTheme;
```

### Cross-Platform Consistency
Design tokens ensure visual consistency across:
- iOS (React Native)
- Android (React Native)
- Web (Next.js with Tailwind)

---

## Voice & Tone

The visual design should reflect these brand attributes:

- **Authoritative**: Professional, government-grade design
- **Modern**: Cutting-edge, forward-thinking aesthetics
- **Accessible**: Clear hierarchy, readable typography
- **Sophisticated**: Premium feel without being pretentious
- **Transparent**: Clear, honest presentation of complex information

---

## Future Enhancements

Potential additions to the design system:

1. **Wireframe Wave Pattern**: Subtle background decoration
2. **Dotted Globe Icon**: Brand mark from marketing materials
3. **Animated Gradients**: Subtle color shifts on key elements
4. **Micro-interactions**: Glow effects on hover/press
5. **Custom Typography**: More distinctive futuristic font

---

## Resources

### Design Files
- Theme tokens: `/packages/ui/src/theme-tokens.ts`
- Tailwind config: `/tooling/tailwind/theme.css`
- Component library: `/packages/ui/src/`

### Color References
All color values use standard hex notation for consistency across platforms. OKLCH values are used in Tailwind CSS for perceptual uniformity.

---

**Version**: 1.0
**Last Updated**: January 2026
**Status**: Active - "Deep State Modern" rebrand complete
