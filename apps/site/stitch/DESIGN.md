```markdown
# Design System Specification: The Orchestrated Flow

## 1. Overview & Creative North Star
**The Creative North Star: "The Architectural Logic"**

This design system is not a collection of components; it is a spatial environment designed for the precision-minded developer. We are moving away from the "boxed-in" web and toward an editorial, layered experience that feels like a high-end IDE. 

The system breaks the "template" look through **Intentional Asymmetry** and **Tonal Depth**. By prioritizing background shifts over rigid borders, we create a UI that feels fluid yet structurally sound. We treat the interface as a "Map of Logic," where the user’s journey (the "guided path") is illuminated by vibrant accents against a sophisticated, deep-space backdrop.

---

## 2. Color & Surface Architecture
We utilize a sophisticated palette of deep navies and slates to establish a professional foundation, punctuated by electric pulses of primary and tertiary light.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. 
*   **Boundaries** must be defined solely through background color shifts (e.g., a `surface-container-low` section sitting on a `surface` background).
*   **Depth** is created by the natural juxtaposition of value, not by drawing lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Each inner container uses a tier to define its "altitude" relative to the base.
*   **Base Layer:** `surface` (#060e20)
*   **Primary Workspaces:** `surface-container-low` (#091328)
*   **Interactive Cards/Modules:** `surface-container` (#0f1930)
*   **Floating Context/Modals:** `surface-container-highest` (#192540)

### The "Glass & Gradient" Rule
To escape the "flat" SaaS aesthetic, floating elements (modals, popovers) must utilize **Glassmorphism**. Use semi-transparent surface colors with a `backdrop-blur` of 12px–20px. 
*   **Signature Textures:** Main CTAs and hero states should utilize a linear gradient: `primary` (#a3a6ff) to `primary-dim` (#6063ee) at a 135° angle to give the "Action Blue" a sense of directional kinetic energy.

---

## 3. Typography
The typography strategy balances the precision of technical documentation with the impact of modern editorial design.

*   **Display & Headlines (Space Grotesk):** Chosen for its "tech-brutalist" character. The wide apertures and geometric construction feel engineered. Use `display-lg` for high-impact landing moments to establish authority.
*   **UI & Body (Inter):** The workhorse. Its neutral, high-legibility architecture ensures that complex developer workflows remain readable.
*   **Code & Logic (JetBrains Mono/Fira Code):** To be used for all technical strings, file paths, and snippets. This font should always sit within a `surface-container-lowest` (#000000) block to simulate a terminal environment.

---

## 4. Elevation & Depth
In this system, depth is a functional tool used to guide the developer’s focus through "Tonal Layering."

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural "recess" or "lift" without relying on heavy shadows.
*   **Ambient Shadows:** For floating "Scenes" (overlays), use extra-diffused shadows. 
    *   *Values:* `0px 12px 32px rgba(0, 0, 0, 0.4)`. 
    *   Shadows should never be pure black; they must be a tinted version of the `surface` color to maintain environmental harmony.
*   **The "Ghost Border":** If a border is required for accessibility (e.g., input focus), use the `outline-variant` token at **20% opacity**. 100% opaque borders are strictly forbidden as they clutter the visual flow.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary-dim`. `round-md` (0.375rem). No border. White text (`on-primary-fixed`).
*   **Secondary:** Ghost style. Transparent background, `outline-variant` at 20% opacity. Text in `primary`.
*   **Tertiary (Electric Purple):** Use `tertiary` (#c180ff) for "Logic" actions (branching, routing).

### Input Fields
*   **Styling:** Background set to `surface-container-highest`. No visible border in default state.
*   **State:** On `:focus`, apply a `primary` ghost border (2px) and a subtle `surface-tint` outer glow (4px blur).
*   **Labels:** Use `label-md` in `on-surface-variant` for high-contrast readability.

### Cards & Logic Scenes
*   **Requirement:** Forbid the use of divider lines. 
*   **Execution:** Separate content using vertical white space (use the `xl` spacing scale) or by nesting a `surface-container-low` block within a `surface-container` parent.

### Tooltips & Overlays
*   **Visual Style:** Glassmorphic. Background: `surface-bright` at 80% opacity with `backdrop-blur`. 
*   **Border:** A 1px "Ghost Border" using `outline-variant` at 15% opacity to define the edge against complex code backgrounds.

### Chips (States)
*   **Success:** `on-secondary-container` text on a subtle green tint.
*   **Logic/Route:** `tertiary` text. Use these to represent "nodes" in a developer flow.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. A sidebar might be wider than the content on the right to create a "technical dashboard" feel.
*   **Do** use `Space Grotesk` for numbers and data visualizations to lean into the technical aesthetic.
*   **Do** lean on `surface-container-lowest` (Black) for code areas to provide a high-contrast "Focus Mode."

### Don't
*   **Don't** use 100% opaque borders to separate UI sections. Use color shifts.
*   **Don't** use standard "Drop Shadows" (short blur, high opacity). They feel dated and heavy.
*   **Don't** use generic icons. Every icon should be a stroke-based, 1.5px weight glyph that feels like it was pulled from a technical schematic.
*   **Don't** crowd the interface. Developers need "mental whitespace" to parse complex logic. Use the `lg` and `xl` spacing tokens generously.