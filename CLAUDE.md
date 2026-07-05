# Building new design pages from Figma frames

Stack: Next.js 14 (App Router, `src/app/*`) · Tailwind CSS 3 · Motion (framer-motion) · Zustand.
Mobile-first PWA. The `lg` breakpoint (1100px, not the default 1024px) is the mobile↔desktop divider.

## The workflow

We build new pages from Figma frames **without** the Figma MCP (free Figma plan → MCP is capped at
~6 calls/month and unusable). Instead:

1. User pastes the Figma frame as an image + names the target route (e.g. `src/app/meals`).
2. Reproduce the frame's **layout, flow, and elements** — but **not its colors**. Skin it with this
   app's existing theme (see Color rules). The frame is the structure; the theme is ours.
3. Reuse existing components (see below) before writing new ones.
4. Verify against the frame: run the dev server and check the page at **390px** and a desktop width
   (have the user view/screenshot if needed). Do **NOT** use the `chrome-devtools` MCP — the user banned
   it. Compare to the frame, list the differences, fix at most ~3 per round. Repeat until it matches.
   (This loop is the main quality lever — always close it.)

## Color rules (most important — this app is a recolor-in-place codebase)

- **Never hardcode hex** (`#541D7A`) and **never use arbitrary color classes** (`bg-[#541d7a]`).
  The codebase has ~700 legacy hardcoded hex values — do not add more. Use the named tokens below.
- Named color utilities (defined in `tailwind.config.js` → `theme.extend.colors`) — use these:
  - Brand: `primary` (#541D7A purple), `secondary` (grey text), `tertiary`, `cyborg-purple`, `cyborg-ink`
  - Surfaces: `bg-pageBackground` (#F2F2F2 page bg), `border-borderColor` (#E6E6E8 hairlines)
  - Text: `text-primary`, `text-secondary` (default muted grey), `text-ink`
  - Status: `biomarkerOptimal` (green), `biomarkerNormal` (yellow), `biomarkerOutOfRange` (pink)
- Common real usage to match: `text-secondary`, `border-borderColor`, `bg-pageBackground`, `bg-primary`,
  `text-primary`, `border-primary`. Mirror these patterns from neighboring pages.
- If the frame needs a color with no existing token, ask before inventing one — don't guess a hex.

## Reuse these components before building new ones

- Primitives: `Button`, `Input`, `Select`, `SearchBar`, `Container` (`.tsx`), `ProgressBar`, `FilterTabs`,
  `IconTabs`, `DropdownFilter`, `FloatingActionButton`
- Chrome: `TopNavbar`, `BottomNavbar`, `Navbar`, `LayoutWrapper`, `HeaderActions`
- Food/meals domain: `MealDetailsSheet`, `MealItemRow`, `MealReviewScreen`, `MealUploadSheet`,
  `FoodScoreScreen`, `TimelineMealCard`, `ProductCard`, `ProductSection`
- Cards/data: `GoalCard`, `StatItem`, `StatsGrid`, `BiomarkerCard`, `StatusCard`
- Landing/marketing sections live in `src/components/sections/*` and `src/components/home/*`.

## Conventions

- Pages are `src/app/<route>/page.js`. Match the file style of neighbors (mostly `.js`, some `.tsx`).
- Mobile-first: write base styles for mobile, add `lg:` for desktop. Verify BOTH widths.
- Animations: use Motion. A static Figma frame carries no motion data — ask for intended
  transitions/durations or keep them subtle and consistent with existing pages.
- Fonts: Inter via `font-sans` / `font-heading` (already the default).
- Don't restructure the theme or "improve" colors unless asked — keep the same theming.
