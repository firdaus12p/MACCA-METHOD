# StyleGuide

> **Framework:** [CSS Framework] | **Approach:** [Utility-first / Component-based]

## Document Role
- **Source of Truth:** Visual system and UI conventions for this project
- **Primary Owner:** `brainstorm-styleguide`
- **Out of Scope:** Backend logic, API contracts, and non-UI technical architecture

## Supported Surfaces
| Surface | Included? | Notes |
|---------|-----------|-------|
| Web app | Yes / No | [notes] |
| Admin panel | Yes / No | [notes] |
| Marketing site | Yes / No | [notes] |
| Email / PDF / export | Yes / No | [notes] |

---

## 1. CSS Framework
- **Framework:** [Tailwind CSS v3 / Bootstrap 5 / CSS Modules / etc.]
- **Version:** [version]
- **Notes:** [Additional rules]

## 2. Color Palette
| Role | Hex | Tailwind | Description |
|------|-----|----------|-------------|
| Primary | `#xxx` | `bg-blue-600` | Main brand |
| Secondary | `#xxx` | `bg-gray-600` | Accent |
| Background | `#xxx` | `bg-gray-50` | Page background |
| Surface | `#xxx` | `bg-white` | Card/panel background |
| Primary Text | `#xxx` | `text-gray-900` | Main text |
| Secondary Text | `#xxx` | `text-gray-500` | Secondary text |
| Error | `#xxx` | `text-red-500` | Error message |
| Success | `#xxx` | `text-green-500` | Success message |
| Warning | `#xxx` | `text-yellow-500` | Warning message |
| Info | `#xxx` | `text-blue-500` | Info message |

**Dark Mode:** [Supported / Not supported]

## 3. Typography
- **Heading Font:** [Font Name] — via [Google Fonts / local]
- **Body Font:** [Font Name] — via [Google Fonts / local]

| Level | Size | Weight | Line Height |
|-------|------|--------|-------------|
| H1 | [size] | [weight] | [line-height] |
| H2 | [size] | [weight] | [line-height] |
| H3 | [size] | [weight] | [line-height] |
| H4 | [size] | [weight] | [line-height] |
| Body | [size] | regular | [line-height] |
| Small | [size] | regular | [line-height] |
| Caption | [size] | regular | [line-height] |

## 4. Spacing System
- **Base Unit:** [4px / 8px]
- **Scale:** [Tailwind Default / Custom]

| Token | Value | Tailwind |
|-------|-------|----------|
| xs | [4px] | `p-1` |
| sm | [8px] | `p-2` |
| md | [16px] | `p-4` |
| lg | [24px] | `p-6` |
| xl | [32px] | `p-8` |
| 2xl | [48px] | `p-12` |

## 5. Component Style
- **Border Radius:** [rounded-md / rounded-lg / none]
- **Shadow:** [shadow-sm / shadow-md / none]

## Component Inventory
| Component | Status | Notes |
|-----------|--------|-------|
| Button | Defined | [notes] |
| Card | Defined | [notes] |
| Input | Defined | [notes] |
| Modal | Defined / Deferred | [notes] |
| Table | Defined / Deferred | [notes] |

### Button
| Variant | Style |
|---------|-------|
| Primary | [bg-primary text-white rounded-md px-4 py-2] |
| Secondary | [outline / ghost] |
| Danger | [bg-error text-white] |

### Card
- Background: [surface color]
- Border: [border style]
- Shadow: [shadow level]
- Padding: [padding value]

### Input
- Border: [border style]
- Focus: [focus ring style]
- Error state: [error border + message style]

### Transition & Animation
- **Default Duration:** [150ms / 200ms / 300ms]
- **Easing:** [ease-in-out / ease-out]
- **Pattern:** `transition-all duration-150 ease-in-out`

## 6. Responsive & Breakpoints
- **Approach:** [Mobile-first / Desktop-first]

| Breakpoint | Value | Description |
|------------|-------|-------------|
| sm | [640px] | Small tablet |
| md | [768px] | Tablet |
| lg | [1024px] | Desktop |
| xl | [1280px] | Large desktop |

**Layout Rules:**
- [Description of layout changes per breakpoint]

## 7. Iconography
- **Library:** [Lucide React / Heroicons / FontAwesome / etc.]
- **Default Size:** [20px / 24px]
- **Import Pattern:** `import { IconName } from 'lucide-react'`
- **Notes:** [Rules for icon usage]

## 8. Accessibility, Localization & Operational States
- **Accessibility Target:** [PRD target / WCAG level]
- **Keyboard & Focus:** [rules]
- **Screen Reader & Labels:** [rules]
- **Reduced Motion:** [behavior]

| State | Required UI Behavior | Recovery/Action |
|-------|----------------------|-----------------|
| Loading | [skeleton/progress] | [wait/cancel] |
| Empty | [message/CTA] | [next action] |
| Error | [message/retry] | [recovery] |
| Forbidden | [explanation] | [request access/back] |
| Offline/Partial | [if applicable] | [sync/retry] |

- **Locales & Text Expansion:** [supported locales or N/A]
- **Formatting:** [date/number/currency/timezone]
- **RTL:** [supported / N/A]
- **UI Performance Budget:** [fonts/assets/motion/render constraints]

## Non-Goals / Not Yet Defined
- [UI areas intentionally outside this style guide]

## Assumptions & Open Questions
- [Assumption about branding, assets, or surface coverage]
- [Question that needs confirmation]
