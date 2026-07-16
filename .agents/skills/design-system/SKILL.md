---
name: design-system
description: Ensures UI consistency by adhering to the Vanilla Gorilla earthy CSS design system.
---

# Skill: Design System

Use this skill when modifying the user interface, adding new page structures, or building visual components. This ensures that the site retains a premium, consistent, and organic aesthetic.

## Visual Standards

1.  **Color Tokens**: Always use the CSS variables declared in `src/css/style.css`. Do not write hardcoded color hex codes or rgb values.
    - `--bg-primary` (#f8f6f2): Warm linen background.
    - `--bg-secondary` (#f0ebe1): Earthy sand background.
    - `--text-main` (#2b2927): Deep bark charcoal.
    - `--color-primary` (#596e57): Sage green accent.
    - `--color-secondary` (#c98263): Terracotta clay accent.
    - `--color-accent` (#cca05a): Ochre gold accent.
2.  **Typography**:
    - Sans-serif: `Outfit` (for body text, nav, UI elements).
    - Serif: `Playfair Display` (for headers, post titles, hero elements).
3.  **Lightshow Lightbox**:
    - For galleries, use the CSS-only lightbox modal structure matching the target IDs (`#img1`, `#img2`, etc.) and classes (`lightbox-target`, `lightbox-content`, `lightbox-close`, `lightbox-nav`, `lightbox-prev`, `lightbox-next`).

## Workflow

1.  **Read CSS**: Inspect `src/css/style.css` to verify layout rules (grid spacing, shadow sizes, borders).
2.  **Edit CSS**: Make modifications strictly in `src/css/style.css`.
3.  **Compile & Verify**: Run `npm run build` to compile the changes and run the minifier. Inspect `dist/` in the browser to verify styling, margins, and responsiveness.
