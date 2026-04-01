# Design System Document

## 1. Overview & Creative North Star: "The Curated Library"

This design system is built upon the concept of **The Curated Library**. We are moving away from the "disposable" feel of modern mobile gaming and toward the permanence of a physical heirloom. The goal is to evoke the tactile sensation of heavy linen paper, the soft glow of a brass lamp, and the quiet dignity of a private study.

To achieve this, we reject the rigid, boxy constraints of standard "digital-first" UI. Our layouts should feel like a tabletop arrangement: intentional, layered, and slightly organic. We prioritize **Tonal Depth** over structural lines and **Editorial Breathing Room** over information density. Every screen should feel like an invitation to a shared experience, not a software interface.

---

## 2. Color Theory & Surface Strategy

Our palette is rooted in nature and traditional craftsmanship. We use deep greens and aged golds to provide a sense of history, grounded by warm neutrals.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Traditional "dividers" are an artifact of poor digital design. Boundaries must be defined solely through background color shifts or the "The Layering Principle" (see Section 4).

### Surface Hierarchy & Nesting
Instead of a flat grid, treat the UI as a series of physical layers—like stacked sheets of fine parchment.
- **Base Level:** `surface` (#FCF9F0) – The foundation of the "table."
- **Sectioning:** Use `surface-container-low` (#F6F3EA) for large structural areas.
- **Interactive Elements:** Use `surface-container-lowest` (#FFFFFF) for primary cards to give them a "bleached parchment" lift.
- **Nesting:** Place a `surface-container-highest` (#E5E2DA) element within a `surface-container` to indicate a recessed or "pressed" area, like an inset book sleeve.

### The "Glass & Gradient" Rule
To add soul to the interface, avoid flat-fill shapes for primary actions. Use a subtle **Atmospheric Gradient** for primary CTA buttons, transitioning from `primary` (#163821) to `primary_container` (#2D4F36) at a 15-degree angle. This mimics the way light hits a bound leather book. For overlays (modals), utilize **Glassmorphism**: use `surface` with 80% opacity and a `20px` backdrop-blur to maintain the "warm library" glow while focusing the user.

---

### 3. Typography: The Editorial Voice

We utilize a high-contrast scale to create an "Editorial" feel. The interplay between a literary serif and a functional sans-serif defines the system’s character.

* **Display & Headlines (Newsreader):** This is our "Homely" voice. It should be used with generous leading. Use `display-lg` for moments of celebration and `headline-md` for screen titles. The serif conveys the "Library" aesthetic.
* **Titles & Body (Work Sans):** Our functional voice. Work Sans provides a clean, modern legibility that balances the traditional weight of Newsreader.
* **The Signature Scale:** Always maintain a significant jump between `headline-lg` and `body-md`. This creates a sense of hierarchy that mimics a printed book or a high-end menu.

---

## 4. Elevation & Depth

We eschew the "material" floating shadow in favor of **Tonal Layering** and **Ambient Light**.

* **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface` background creates a natural, soft lift.
* **Ambient Shadows:** If an element must "float" (like a primary action button or a modal), use a shadow with a blur value of `24px` to `40px` at 6% opacity. Use a tinted shadow color derived from `on_surface` (#1C1C17) rather than pure black to keep the light feeling "warm" rather than "digital."
* **The Ghost Border Fallback:** If accessibility requires a stroke (e.g., in high-glare environments), use the `outline_variant` token at **15% opacity**. This creates a "watermark" effect rather than a hard line.

---

## 5. Components

### Buttons
* **Primary:** A "Leather-Bound" feel. Uses the `primary` to `primary-container` gradient. Text is `on_primary` (White). Corner radius: `md` (0.375rem).
* **Secondary:** The "Brass" accent. Uses `secondary` (#7B5800) text on a `secondary_fixed_dim` (#F7BD48) background. No shadow.
* **Tertiary:** Text-only in `primary_fixed_variant`. No container.

### Cards & Lists
* **Prohibition:** Never use a line to separate list items.
* **Execution:** Separate items using **Vertical White Space** (`spacing-4`). For distinct cards, use a background shift to `surface-container-low` with a corner radius of `xl` (0.75rem).

### Input Fields
* **Styling:** Inputs should feel like "blots" on paper. Use `surface_container_high` with no border. On focus, the field should transition to `surface_container_lowest` with a subtle 10% `secondary` (Gold) ghost-border.
* **Labels:** Always use `label-md` in `on_surface_variant` (#424842) for a "pencil-written" feel.

### Specialized Game Components
* **Game Cards:** These are the heart of the system. Use `surface_container_lowest` for the card face. Use a `1.5` (0.5rem) padding for the internal "safe area." If the card is "Active," apply a `2px` ghost-border using `secondary` (Gold) at 40% opacity.
* **Score Tally:** Use `display-sm` (Newsreader) for numbers to make the score feel like a hand-inked ledger.

---

## 6. Do’s and Don’ts

### Do
* **Embrace Asymmetry:** When placing cards or images, offset them by `spacing-1` or `spacing-2` to mimic physical items on a table.
* **Use Wide Margins:** Use `spacing-6` or `spacing-8` for outer page margins to create a premium, editorial feel.
* **Think in Layers:** Always ask, "Can I define this area with a color shift instead of a line?"

### Don’t
* **No "Arcade" Visuals:** No neon glows, no high-vibrancy blues/purples, and no rapid "pop" animations.
* **No Pure Black:** Never use #000000. Use `on_surface` (#1C1C17) to keep the text feeling like ink on paper.
* **No Crowding:** If the screen feels full, increase the spacing. A "Library" should feel spacious and quiet.