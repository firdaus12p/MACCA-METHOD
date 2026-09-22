# StyleGuide

> **Authoring note:** This is a placeholder menu, not a checklist to build. Keep only approved surfaces, components, and states; prune inapplicable sections or mark `N/A` with a reason. Unknown mandatory decisions remain open, not `N/A`. Reuse mature approved styles and native/existing controls. Do not automatically add a design system, dark mode, localization, or packages. Additions need a current requirement, why simpler options fail, cost within team/budget/operations constraints, and an escalation trigger. Critical depth deepens questions; accessibility and required security/recovery states remain obligations.

> **Styling:** [Existing/native approach; framework only if selected]

## Document Role

- **Source of Truth:** Visual system and UI conventions for this project
- **Primary Owner:** `brainstorm-styleguide`
- **Out of Scope:** Backend logic, API contracts, and non-UI technical architecture

## Supported Surfaces

| Surface              | Included? | Notes   |
| -------------------- | --------- | ------- |
| [Approved surface]   | Yes / No  | [source requirement] |

---

## 1. Styling Approach

- **Native / Existing Styles:** [selected approach; framework optional]
- **Version:** [version]
- **Notes:** [Additional rules]

## 2. Color Palette

| Role           | Value   | Existing Token / Style | Purpose / Contrast |
| -------------- | ------- | ---------------------- | ------------------ |
| [Needed role]  | [value] | [token/style]          | [usage/check]      |

**Dark Mode:** [Supported / Not supported]

## 3. Typography

- **Heading Font:** [existing/system font; custom source only if justified]
- **Body Font:** [existing/system font; custom source only if justified]

| Level   | Size   | Weight   | Line Height   |
| ------- | ------ | -------- | ------------- |
| H1      | [size] | [weight] | [line-height] |
| H2      | [size] | [weight] | [line-height] |
| H3      | [size] | [weight] | [line-height] |
| H4      | [size] | [weight] | [line-height] |
| Body    | [size] | regular  | [line-height] |
| Small   | [size] | regular  | [line-height] |
| Caption | [size] | regular  | [line-height] |

## 4. Spacing System

- **Base Unit:** [existing/approved unit if used]
- **Scale:** [existing/native conventions or needed values]

| Token / Usage | Value   | Existing Style |
| ------------- | ------- | -------------- |
| [Needed gap]  | [value] | [style]        |

## 5. Component Style

- **Border Radius:** [existing/approved value if needed]
- **Shadow:** [existing/approved value if needed]

## Component Inventory

| Component | Status             | Notes   |
| --------- | ------------------ | ------- |
| [Required component] | Existing / Gap | [approved surface and requirement] |

### Button

| Variant   | Style                                        |
| --------- | -------------------------------------------- |
| [Needed variant] | [existing/native style and accessible states] |

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

- **Duration:** [value justified by needed feedback, if motion applies]
- **Easing:** [existing/approved behavior if motion applies]
- **Pattern:** [only needed motion; reduced-motion alternative]

## 6. Responsive & Breakpoints

- **Approach:** [Mobile-first / Desktop-first]

| Breakpoint | Value    | Description   |
| ---------- | -------- | ------------- |
| [Needed breakpoint] | [value] | [content/device constraint] |

**Layout Rules:**

- [Description of layout changes per breakpoint]

## 7. Iconography

- **Source:** [existing/native assets; new library only if justified]
- **Size:** [appropriate to actual usage and accessibility]
- **Usage Pattern:** [actual selected source, if needed]
- **Notes:** [Rules for icon usage]

## 8. Accessibility, Localization & Operational States

- **Accessibility Target:** [PRD target / WCAG level]
- **Keyboard & Focus:** [rules]
- **Screen Reader & Labels:** [rules]
- **Reduced Motion:** [behavior]

| State           | Required UI Behavior | Recovery/Action       |
| --------------- | -------------------- | --------------------- |
| Loading         | [skeleton/progress]  | [wait/cancel]         |
| Empty           | [message/CTA]        | [next action]         |
| Error           | [message/retry]      | [recovery]            |
| Forbidden       | [explanation]        | [request access/back] |
| Offline/Partial | [if applicable]      | [sync/retry]          |

- **Locales & Text Expansion:** [supported locales or N/A]
- **Formatting:** [date/number/currency/timezone]
- **RTL:** [supported / N/A]
- **UI Performance Budget:** [fonts/assets/motion/render constraints]

## Non-Goals / Not Yet Defined

- [UI areas intentionally outside this style guide]

## Assumptions & Open Questions

- [Assumption about branding, assets, or surface coverage]
- [Question that needs confirmation]
