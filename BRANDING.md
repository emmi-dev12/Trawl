# Trawl Branding & Design System

## Brand Identity

**Trawl** is a professional developer utility for web scraping. The brand communicates calm, controlled power through metaphors of exploration and data extraction.

### Brand Personality

- 🌊 **Calm but powerful** – controlled, predictable, not chaotic
- 🧰 **Developer utility** – technical, precise, no-nonsense
- 🔍 **Investigative** – deep exploration without malicious vibes
- ⚙️ **Engineered** – clean, efficient, well-crafted

---

## Logo & Visual Identity

### Logo Concept: T + Net Hybrid

The logo combines:
- **Vertical stroke** – the main "T" (Trawl)
- **Horizontal stroke** – the top of the "T"
- **Curved net** – catching data points below

This creates a unified symbol that:
- ✅ Is instantly readable as "T"
- ✅ Embeds the net/extraction metaphor
- ✅ Scales perfectly from 16px to 512px
- ✅ Looks professional in dock, menu bar, header

```
    ━━━━━━━━━━  ← Top of T (horizontal sweep)
       ┃         ← Main crawl path (vertical)
    ┌──┴──┐
   ╱       ╲     ← Net shape (curved)
  ●    ●    ●    ← Data points caught
   ●  ●  ●       
```

### Logo Usage

- **Header**: `src/assets/logo.svg` (64px reference)
- **App Icon**: `src/assets/icon.svg` (512px with gradient)
- **Favicon**: Can be derived from logo.svg
- **Menubar**: Simplified net shape (16px)

---

## Color Palette

### Primary Colors

| Color | Hex | Usage | Meaning |
|-------|-----|-------|---------|
| **Aqua Blue** | `#4CC9F0` | Primary accent, CTAs, progress | Data flow, exploration |
| **Deep Navy** | `#0B1220` | Background | Calm, professional depth |
| **Soft White** | `#E6EDF7` | Text | Clean, readable |

### Supporting Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Sky Blue | `#38BDF8` | Hover states, highlights |
| Cyan | `#06B6D4` | Tertiary accent |
| Success Green | `#10B981` | Completion, success states |
| Error Red | `#EF4444` | Errors, warnings |
| Neutral Gray | `#8892B0` | Secondary text |

### Background Gradients

```css
/* Default */
background: linear-gradient(135deg, #1a2a3d 0%, #0f172a 100%);

/* Status bar active */
background: linear-gradient(90deg, #0f172a 0%, rgba(76, 201, 240, 0.05) 100%);
```

---

## Typography

### Font Stack

**Primary**: Inter (recommended)  
**Fallback**: SF Pro (macOS native)  
**Backup**: Segoe UI

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Inter, sans-serif;
```

### Type Scales

- **Logo/Header**: 28px, Weight 700, Letter-spacing -0.5px
- **Section Titles**: 14px, Weight 600, Uppercase, Letter-spacing 0.5px
- **Body Text**: 13px, Weight 400
- **Small Text**: 12px, Weight 500
- **Micro Text**: 11px, Weight 600, Uppercase

---

## Shape Language

### Curves & Motion

- **Border radius**: 4px (small), 6px (medium), 8px (large)
- **Transitions**: 150ms ease-out (standard)
- **Animations**: Smooth, purposeful, not excessive

### Visual Hierarchy

1. **Primary actions**: Full aqua blue, prominent size
2. **Secondary actions**: Border-only style, smaller
3. **Tertiary actions**: Subtle, text-only or icon-only
4. **Disabled**: 50-60% opacity, no hover

---

## Component Styling

### Form Inputs

```
Input: #1a2a3d background, #2a3a50 border
Focus: #4CC9F0 glow effect, cursor changes
Disabled: 60% opacity, not-allowed cursor
```

### Buttons

```
Primary: #4CC9F0 background
Hover: #38BDF8 background, -2px transform
Active: 0.98 scale
Disabled: 50% opacity, not-allowed
```

### Tables

```
Header: Sticky, #1a2a3d background
Rows: Alternating with #0f172a
Hover: Highlight to #2a3a50
Links: #4CC9F0 with underline on hover
```

### Progress Indicators

```
Background: #2a3a50
Fill: Linear gradient #4CC9F0 → #38BDF8
Shadow: 0 0 8px rgba(76, 201, 240, 0.5)
```

---

## Motion & Micro-interactions

### Loading States

- Spinner: 1s rotation loop, #4CC9F0 color
- Pulse: Subtle 1.5s opacity pulse

### Transitions

- Hover: 150ms ease-out
- State change: 300ms ease-out
- Reveal: 300ms ease-out with transform

### Optional Delights

- Net expands on scrape start
- Data points snap into grid on completion
- Progress bar glows during active scraping
- Success checkmark animates on completion

---

## Accessibility

- **Color contrast**: All text meets WCAG AA standards
- **Focus states**: Clear blue outline on all interactive elements
- **Motion**: Respects `prefers-reduced-motion`
- **Icon labels**: All icons have descriptive titles

---

## Implementation

### CSS Variables

All colors use CSS custom properties:

```css
:root {
  --color-primary: #4CC9F0;
  --color-bg: #0B1220;
  --color-text: #E6EDF7;
  /* ... */
}
```

### Responsive Design

- Mobile-first approach
- Breakpoints: 768px, 1024px, 1440px
- Touch targets: Min 44x44px

### Dark Mode

Trawl is built dark-only. This brand is inherently nocturnal—data exploration happens in the deep.

---

## Asset Files

```
src/assets/
├── logo.svg          (64px reference logo)
├── icon.svg          (512px app icon)
├── favicon.svg       (derived from logo)
└── menubar.svg       (simplified net shape, 16px)
```

---

## Brand Guidelines Summary

✅ **Do**
- Use aqua blue for primary CTAs and highlights
- Keep shapes geometric but with soft curves
- Maintain negative space in layouts
- Use the T+Net logo consistently
- Respect the calm, professional tone

❌ **Don't**
- Mix with other bright colors
- Use harsh shadows or effects
- Deviate from the logo design
- Use serif fonts
- Add unnecessary visual noise

---

## Future Evolution

As Trawl grows, maintain these core principles:

1. **Metaphor consistency**: Everything relates to nets, water, data flow
2. **Simplicity**: Remove before adding
3. **Professional tone**: Always feel like a dev tool, never a game
4. **Controlled power**: Confidence without aggression

The brand should feel like a well-engineered fishing vessel—purposeful, powerful, and calm.
