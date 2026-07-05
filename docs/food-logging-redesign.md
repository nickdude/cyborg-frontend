# Food Logging Redesign — Progress & Resume Notes

**Status:** Design brainstorm PAUSED (no feature code written). Resume at "Next steps."

## Goal
Wire the currently-dead "Log Food" button into the real food-from-picture workflow, sync logged
meals back to the dashboard, and build a richer, better-designed food-logging experience
(Figma frames = flow reference, not the visual bar).

## Current implementation (as-is)
- **Working flow (mobile only):** `BottomNavbar` "+" (`lg:hidden`) → `MealUploadSheet` → `MealDetailsSheet`
  (real multipart POST `mealAPI.analyze`, server-side vision → writes `sessionStorage["cyborg.mealDraft"]`
  → `router.push("/meals/new")`) → `/meals/new` = `MealReviewScreen` (mode="new") → `mealAPI.commit` → `/meals`.
- **Dashboard "Log Food" is a DEAD no-op:** `TimelineCard` → `ActionButtons` `{label:"Log Food", href:"/meals/new"}`;
  `/meals/new` needs a draft in sessionStorage, none on cold nav → redirects to `/dashboard`.
  (`src/app/dashboard/page.js:1035`, `src/components/home/ActionButtons.js`, `src/app/meals/new/page.js:38-43`)
- **Desktop has NO food-log entry** (BottomNavbar is `lg:hidden`; TopNavbar has none).
- **Dashboard never refreshes after logging:** `TimelineCard` fetches `timelineAPI.get`+`mealAPI.summary`
  once on `userId`; no re-fetch → new meals need a reload. (`src/app/dashboard/page.js:1015-1066`)
- **No meal store** (only `src/stores/concierge.js`); meal state lives on the backend.

## Backend (exists) — `src/services/api.js:172-289`
- `mealAPI`: analyze, commit, list, history, summary, get, update, delete.
- `timelineAPI.get`; `foodScoreAPI` (get/compute/listByDate); `glucoseAPI` (dayReview/predictions);
  `foodSearchAPI.search(userId,q)` → `/foods/search?q=`.
- **Gaps:** no "recent/past logs" endpoint; no serving-size scaling endpoint. `foodSearchAPI` has ZERO consumers.

## Data shapes
- Item (`MealItemRow`): `{ name, portion:{quantity,unit,grams}, calories, proteinG, fatG, carbsG }`
  — **no per-item fiberG/sugarG** (only at meal totals).
- Totals: `{ calories, proteinG, carbsG, fatG, fiberG, sugarG }`.
- Commit supports imageless (manual) meals: `{title, consumedAt, totals, items, imageKeys([] ok), inputText, confidence, tokensUsed}`.
- Draft `cyborg.mealDraft`: `{ estimate:{title,totals,items,confidence,notes,tokensUsed}, imageKeys, imagePreviews(dataURLs), pickedAt }`.

## Reference flow (Figma) — target functionality; Review screen becomes the HUB
1. Log Food → Review (empty; macros "--"; `[+ Scan food]` `[+ Add An Item]`; Save).
2. Add An Item → Search (search bar; "From your past logs"; result cards: icon, name, portion•macros, `+`).
3. `+` → item appended to Review; MACRO SPLIT populates; "N ITEM" + Select; card has pencil+×; `[+ Add more]`.
4. Select mode → radio → "Delete Log" / Done (item management).
5. Edit (pencil) → Edit Log: per-item macros + SERVING SIZE (quantity + unit e.g. "Cup, Diced") + Remove item.

## Decisions locked
- Build **better UI/UX/CX** than the reference frames.
- **CX north-star: balance of Confidence + Insight loop + Delight** (not primarily speed).
  → Review = trustworthy editable heart; save→score/glucose/twin-impact payoff; polish + a signature.
- **Visual latitude: UNDECIDED.** Was about to show 3 directions as browser mockups:
  A Elevate-within-system · B Signature-food-surface (recommended) · C Bold-redesign.

## Robustness improvements to bake in
1. Totals **derived** from items (live sum), not a frozen AI lump — required for add/remove/edit-serving.
2. Items need per-item **fiberG/sugarG** for an accurate macro split (currently missing).
3. "From your past logs" data source — backend recent-foods endpoint OR derive from `mealAPI.history` (TBD).
4. Serving-size scaling — base-per-serving nutrition (frontend scale) OR backend recompute endpoint (TBD); unit conversions non-trivial.
5. Clarify Select/Delete semantics (mock's single-radio + "Delete Log" is ambiguous; recommend multi-select "Remove (N)"; reserve "Delete Log" for saved meals).
6. **Global trigger:** lift flow into a Zustand store (mirror `concierge.js`) + mount `MealUploadSheet`/`MealDetailsSheet`
   once in `LayoutWrapper` (works desktop+mobile); point Log Food button + BottomNavbar "+" at it.
7. **Refresh dashboard on commit:** bump `mealsVersion` in the store; `TimelineCard` depends on it.
8. Post-log landing: decide (recommend back to dashboard, refreshed).
9. Guards: disable Save on empty meal; search debounce/loading/empty/error; duplicate-item handling.

## Open questions (resolve on resume)
- Visual latitude A/B/C → **show mockups, get pick**.
- Scope for v1 (desktop entry / manual add / food-score+glucose / nutrition summary).
- Past-logs source + serving-scale source (need backend confirmation).
- Post-log landing behavior.

## Next steps (resume here)
1. Show the 3 visual-direction mockups → user picks latitude.
2. Lock v1 scope.
3. Confirm the 2 backend dependencies (recent foods, serving scaling).
4. Write full design spec → implementation plan.
5. Implement: `foodLog` Zustand store + lift sheets to `LayoutWrapper` + wire Log Food (dashboard+desktop) +
   refresh-on-commit; then Review-as-hub, manual search, item edit/serving, save→score.

## Key files
- `src/app/dashboard/page.js` (TimelineCard ~1015, ActionButtons ~1035, HomeTabs ~546, WelcomeTwinCard ~724)
- `src/components/home/ActionButtons.js`
- `src/components/BottomNavbar.js` (mealSheet state ~56, sheets ~242)
- `src/components/LayoutWrapper.js` (mount point ~101)
- `src/components/{MealUploadSheet,MealDetailsSheet,MealReviewScreen,MealItemRow,FoodScoreScreen}.js`
- `src/app/meals/new/page.js`, `src/app/meals/[mealId]/page.js`, `src/app/meals/[mealId]/score/page.js`, `src/app/meals/page.js`
- `src/services/api.js` (meal/timeline/foodScore/glucose/foodSearch APIs ~172-289)
- `src/stores/concierge.js` (Zustand pattern to mirror)
