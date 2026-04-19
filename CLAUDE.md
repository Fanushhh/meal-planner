# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# One-off DB patches (write a small script, run it, delete it)
npx dotenv-cli -e .env.local -- npx tsx scripts/your-script.ts

npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once (CI)

# Run a single test file
npx vitest run tests/unit/meal-generator.test.ts

# Database (requires DATABASE_URL in .env.local — dotenv-cli loads it automatically)
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply migrations to Neon Postgres
npm run db:seed      # Seed Săptămâna I meals (skips if table already has rows)
```

After changing `src/server/db/schema.ts`, always run `db:generate` then `db:migrate`.

## Architecture

### Tech Stack
- **Next.js 16** with App Router, TypeScript, Tailwind CSS v4
- **Neon Postgres + Drizzle ORM** via `@neondatabase/serverless` + `drizzle-orm/neon-http`. `DATABASE_URL` stored in `.env.local`. Schema uses `pgTable`; timestamp columns use `bigint({ mode: "number" })` because `Date.now()` milliseconds exceed Postgres `INTEGER` max.
- **Authentication** — email OTP (6-digit code, 10-min TTL, hashed with HMAC-SHA256 + random salt), `HttpOnly` session cookie (30-day), no JWT
- **Email** — Resend (`resend` package). `EMAIL_FROM` must be `onboarding@resend.dev` for testing without a verified domain, or a verified custom domain for production
- **Routing protection** — `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`). The exported function must be named `proxy`, not `middleware`. Does **not** redirect authenticated users away from auth pages (avoids stale-cookie infinite loop).

### Route Groups
- `(auth)` — `/login`, `/verify` — public, no session required
- `(app)` — `/dashboard`, `/onboarding`, `/settings`, `/shopping-list` — requires session; layout at `src/app/(app)/layout.tsx` calls `getSession()` and redirects to `/login` if missing

### Data Flow
All database access goes through three layers:

1. **`src/server/db/schema.ts`** — single source of truth for all types. Use `$inferSelect` / `$inferInsert` for TypeScript types. JSON columns (`ingredients`, `instructions`) are stored as `TEXT` and must be manually `JSON.parse`d when reading.

2. **`src/server/queries/`** — raw DB queries returning typed results. `meals.ts` exports `ParsedMeal` and `Ingredient`. Queries never handle auth.

3. **`src/server/actions/`** — Server Actions (`"use server"`). All mutations go here. They call `getSession()` first for auth, then delegate to queries. Server Actions used with `useActionState` must accept `(_prevState, formData)` as their signature.

> **Server Action gotcha:** Never call `redirect()` inside a Server Action if the caller reads the return value — the redirect throws before the return is reached. Handle navigation in the component after checking the result.

### Meal Plan Generation
`src/server/lib/meal-generator.ts` — pure functions, fully testable without a DB:
- `scoreMeal` — weights meals by repeat-avoidance: base 10, -8 if already used in the plan (minimum weight 1)
- `generateWeeklyPlan` — picks one meal per day per meal type (breakfast/lunch/dinner/snack) for 7 days, producing up to 21 slots. Types with no meals are skipped entirely.
- `pickRerollMeal(allMeals, mealType, currentMealId, planMealIds)` — filters to the same meal type first, then applies repeat-avoidance scoring

Plan generation is triggered lazily on `/dashboard` load via `getOrGeneratePlan()` — checks for an existing `weekly_plans` row matching `(userId, weekStart)` before generating.

### Week Boundary
`getWeekStart()` in `src/server/lib/date.ts` uses UTC exclusively to avoid timezone off-by-one bugs. `weekStart` is always stored as `YYYY-MM-DD` (Monday). A new plan is auto-generated when `weekStart` doesn't match the current Monday.

### Session Architecture
- `src/proxy.ts` — edge check: only reads the session cookie value, does **not** hit the DB. Redirects unauthenticated requests to `/login`. Does **not** redirect authenticated users away from auth pages — removing that block prevents infinite redirect loops when a session cookie exists but the session is not in the DB (e.g. after a DB migration).
- `src/server/lib/auth.ts` — `getSession()` — joins `sessions` + `users`, validates expiry. Called from every Server Component and Server Action that needs the current user.

### Ingredient Structure
`meals.ingredients` is stored as JSON text and parsed to `Ingredient[]` on read:
```ts
type Ingredient = { quantity: number | null; unit: string | null; name: string; note?: string };
```
Quantities are scaled on the recipe page: `scale = numPeople / meal.servings`. `meal.servings` is the base serving count in the DB.

### Routes
- `(app)/meals/[id]` — recipe detail page for seeded/built-in meals. Fetches `numPeople` from user preferences and scales ingredient quantities. The ingredients section is rendered by `src/components/meals/IngredientsPanel.tsx` (client component) which provides per-ingredient and "Add all" shopping list buttons.
- `(app)/my-recipes` — lists all recipes the current user has created.
- `(app)/my-recipes/new` — form to create a new user recipe.
- `(app)/my-recipes/[id]` — recipe detail page for user-created recipes. Same ingredient scaling and shopping list buttons as `meals/[id]`. Includes an "Add to plan" button.
- `(app)/settings` — preferences page. Only setting is number of people (used for ingredient scaling).
- `(app)/shopping-list` — manually curated shopping list. Items are stored in `localStorage` (`meal-planner-shopping-list-v1`). No server-side data beyond auth.

### Schema
`meals` and `user_recipes` store: `name`, `description`, `servings`, `prep_time_min`, `cook_time_min`, `ingredients` (JSON), `instructions` (JSON), `image_url`, and `meal_type` (`"breakfast" | "lunch" | "dinner" | "snack"`, default `"lunch"`). No cuisine or dietary tag columns.

`user_preferences` stores only `num_people` and `onboarding_completed`.

`planned_meals` has up to 3 slots per day (one per meal type). Unique constraint is `(plan_id, day_of_week, meal_type)`.

`MealType`, `MEAL_TYPES`, `MEAL_TYPE_LABELS`, and `MEAL_TYPE_COLORS` are all exported from `src/server/db/schema.ts`.

### Shopping List
Entirely client-side — no DB involvement.

- **`src/lib/shopping-list-utils.ts`** — shared pure utilities (client and server safe): `ShoppingItem` / `ShoppingCategory` types, `normalizeUnit()`, `makeKey()`, `aggregateInto()`, `categorize()`, `buildCategories()`, `formatItem()`. Keyword-based categorisation into **11 Romanian buckets**: Pește, Carne, Ouă, Lactate, Leguminoase, Cereale, Conserve, Legume, Fructe, Condimente, Semințe — with "Altele" as fallback. Rule order matters — first match wins. `normalizeName` strips parentheticals, leading qualifiers (`optional`, `dupa gust`, `puțin`, `cca`, etc.), leading quantity-words (`pumn`, `mână`), and trailing prep-modifier phrases before looking up the canonical name map. `expandIngredient()` is called before `aggregateInto` — it strips "dupa gust" / "puțin" prefixes and splits compound seasoning strings on commas (e.g. `"sare, piper, dafin, cimbru"` → 4 separate items).
- **`src/hooks/use-shopping-list.ts`** — React hook. Reads/writes `localStorage` on mount. Exposes `addItem`, `addItems`, `updateItem`, `removeItem`, `toggleChecked`, `clearChecked`, `clearAll`, `isInList`. `addItem`/`addItems` call `expandIngredient` then `aggregateInto` so identical `(name, normalizedUnit)` pairs are summed, never duplicated. `updateItem(name, unit, patch)` edits an existing item in-place.
- **`src/components/meals/IngredientsPanel.tsx`** — client component used on the recipe page. Receives pre-scaled `AddableItem[]` from the server component. Shows a `+` button per ingredient (turns to a checkmark when already in the list) and an "Add all to list" button.
- **`src/components/shopping-list/ShoppingListClient.tsx`** — reads from `useShoppingList`, groups via `buildCategories`, renders category sections. Clicking the item label toggles checked state. Hover reveals a pencil (edit) and remove button. The edit pencil opens an inline form with qty / unit / name fields. Includes a "Copy list" button (plain-text clipboard), "Remove ticked", and "Clear all".

Quantities added via `IngredientsPanel` are always **scaled** (`numPeople / meal.servings`) before being passed as props from the server component.

**`getPlanIngredients()`** in `src/server/actions/meal-plan.ts` counts how many times each meal appears in the weekly plan and multiplies quantities by that occurrence count (on top of the `numPeople / servings` scale), so a recipe appearing 3 times across the week contributes 3× its ingredients to the list.

### Design System
"La Cucina" editorial/cream theme. CSS custom properties defined in `src/app/globals.css`. Fonts: `Fraunces` (display/headings, `--font-fraunces`) + `Newsreader` (body, `--font-newsreader`) + `JetBrains Mono` (labels/meta, `--font-jetbrains`).

**Palette** — cream paper background (`--paper: #f2e9d8`), dark ink text (`--ink: #2a2620`), terracotta accent (`--accent: #a63a1f`). Old variable names (`--bg`, `--surface`, `--text`, etc.) are kept as legacy aliases in `:root` so existing components continue to work without mass-rewrites.

**Design language** — cookbook/editorial aesthetic. Pages use a chapter structure: "Chapter I / The Week Ahead", "Chapter III / The Pantry of Recipes", etc. Ornaments: `✦`, `☉`, `☼`, `☾`. Utility classes: `.btn`, `.btn-primary`, `.btn-ghost`, `.small-caps`, `.flourish`, `.rule`, `.rule-dashed`, `.slot-surface`, `.nav-link`, `.meal-name-link`.

**Buttons** — `.btn` uses JetBrains Mono 11px uppercase with `letter-spacing: .16em`, 1px solid ink border, no border-radius. `.btn-primary` fills with `--accent` and `color: #fff4e2`. `.btn-ghost` uses `--rule` border and `--ink-2` text. The "Add to plan" trigger, "Write a new recipe", and form save buttons all use this class.

**Form style** — recipe editor (`RecipeEditor.tsx`) uses flat `FormSection` sections: Fraunces italic 20px label + small-caps hint + `.rule` divider, then content. Inputs have bottom-border only (`border: 0; border-bottom: 1px solid var(--rule)`), no background box. Unit field is a `<select>` dropdown. Ingredient rows use a 5-column grid (`28px 90px 110px 1fr 30px`) with sequential 01/02 numbering in JetBrains Mono. Cooking steps use Roman numeral prefixes in Fraunces italic accent color. Save button is in the top header row (left: back link, right: save), not at the bottom.

**Header** — `src/components/layout/Header.tsx` shows "La Cucina — EST. MCMXCII" wordmark and nav links (Recipes / Market List / gear icon). Uses `.nav-link` CSS class for hover styling — no inline event handlers (Server Component). On mobile (≤640px): tagline hidden (`.header-tagline`), "Market List" label hidden (`.header-nav-text`) and replaced by a shopping bag SVG icon (`.header-shopping-icon`) that always shows. The badge rendered by `ShoppingNavLink` uses fully inline styles (not Tailwind utilities) to guarantee positioning. Wordmark has `white-space: nowrap` to prevent wrapping.

**Settings page** — `src/app/(app)/settings/page.tsx` has a prominent account identity card: monogram avatar, "Signed in as" eyebrow, email, and sign-out button. This sits above the preferences section.

### Dashboard Grid
`WeeklyPlanGrid` uses CSS Grid with `gridTemplateColumns: "80px repeat(7, minmax(140px, 1fr))"` — an 80px label column followed by 7 day columns. Rows are grouped by meal type (Mic dejun / Prânz / Cină / Gustare); only types that have at least one planned slot are rendered. Separators between groups are per-column cells (not a single spanning div) so the today-column highlight can run through them unbroken.

`WeeklyPlanGrid` is a **client component** (`"use client"`). It uses `useRef` + `useEffect` to auto-scroll to today's column on mount. `todayIndex` (0=Mon…6=Sun) is passed as a prop from the dashboard server component.

**Today column highlight** — a cohesive vertical band across all rows: 2px accent cap on the header top, 1px warm-tinted side rails (`rgba(212,120,67,0.13)`) on every cell, 4.5% warm wash background, and rounded corners at the top of the header and bottom of the last row. Meal type separators for the today column carry the rails silently with no divider line.

**Meal card left bar** is colour-coded by meal type: breakfast `#F5A623`, lunch `var(--accent)`, dinner `#7B95C4`, snack `#8B77C5`. Same palette used for the meal type badges on the My Recipes page.

### Shopping List — Unseen Badge
`use-shopping-list.ts` tracks a separate `meal-planner-shopping-unseen-v1` localStorage key counting new ingredients added since the user last visited the shopping list. `ShoppingNavLink` listens for a `shopping-list-change` custom event (dispatched on every mutation) and reads the key directly, so the badge updates in real time. `ShoppingListClient` calls `clearUnseen()` on mount. Every mutation function in the hook (`addItem`, `addItems`, `removeItem`, `toggleChecked`, `clearChecked`, `clearAll`) must call `notifyChange()` — omitting it causes the nav badge to lag silently.

### Ingredient Add Feedback
When an ingredient is added via `IngredientsPanel`, the row gets the `.ingredient-flash` CSS class (keyframe defined in `globals.css`) which briefly highlights the row with the accent colour. The add button is never disabled — repeated clicks accumulate quantities via `aggregateInto`.

### Dashboard Actions
`src/components/meal-plan/DashboardActions.tsx` — client component rendered in the dashboard header (right side of the `justify-between` row) when a plan exists. Contains two buttons:
- **Add week to list** — calls `getPlanIngredients()` (server action), then `addItems()` from `useShoppingList`. Shows a teal "Added ✓" confirmation for 2.5 s. Ingredients are scaled by `numPeople`.
- **Regenerate week** — calls `regeneratePlan()` (server action) which deletes the current plan and generates a fresh one.

Both use `useTransition`; each disables the other while in-flight.

`src/server/actions/meal-plan.ts` exports `regeneratePlan()` and `getPlanIngredients()` to support these buttons.

### Meal Card — Randomize & Remove
Any Server Action that accepts a client-supplied `planId` must verify ownership: call `getPlanForWeek(session.user.id, weekStart)` and confirm `plan.id === planId` before mutating.

Each meal card on the dashboard has a three-dot `⋮` button that opens a small dropdown with two options:
- **Randomize** — replaces the slot with a different meal via the `rerollMeal` action.
- **Remove** — deletes the planned meal slot via `removePlannedMealAction` → `removePlannedMeal` query (includes a `userId` ownership check before deleting).

`src/components/meal-plan/MealCardMenu.tsx` is the client component handling this. The button has no inline `opacity: 0` — visibility is controlled entirely by the `.slot-tools` container (CSS `.slot-surface .slot-tools { opacity: 0 }`, shown on hover/focus-within). On mobile, `.slot-tools { opacity: 1 !important }` overrides this so the button is always visible (touch devices have no hover). The mobile list view (`plan-mobile-list`) also renders `MealCardMenu` inline next to each meal name link.

### Mobile Responsiveness
All pages are responsive at ≤640px via CSS class hooks and `@media (max-width: 640px)` rules in `globals.css`. The pattern: add a className to the element, then override its styles in the media query with `!important`. Never use Tailwind utilities for responsive layout — use the CSS class hook pattern instead so Server Components can participate.

**Class hooks by page:**
- **Header** — `.header-outer` (padding), `.header-tagline` (hide tagline), `.header-nav-text` (hide nav labels), `.header-shopping-icon` (show bag icon)
- **Dashboard** — `.dash-pad` (padding), `.dash-nav-row` / `.dash-nav-left` / `.dash-nav-center` / `.dash-actions-wrap` (nav row layout), `.dash-grid-pad` (grid padding), `.dash-footer` (hide), `.dash-btn-long` / `.dash-btn-short` (button label swap), `.plan-grid-scroll` (hide desktop grid), `.plan-mobile-list` (show vertical list), `.slot-tools` (always visible)
- **My Recipes** — `.recipes-pad` (padding), `.recipes-header` (stack title+button), `.recipes-filter-grid` (single column filters), `.recipes-grid` (single column cards)
- **Recipe detail** (`/meals/[id]`, `/my-recipes/[id]`) — `.recipe-pad` (padding), `.recipe-back-row` (stack back+actions), `.recipe-meta-strip` (2×2 grid), `.recipe-two-col` (single column ingredients+method)
- **Settings** — `.settings-pad` (padding), `.settings-account-row` (stack email+signout)

### Adding Recipes
Recipes are added through My Recipes (`/my-recipes/new`). Each recipe has: name, description, servings, prep time, cook time, meal type, ingredients (with quantity/unit/name/note), and step-by-step instructions. No cuisine or dietary tag.

### Add to Plan Widget
`src/components/meal-plan/AddToPlanWidget.tsx` — client component rendered on both `/meals/[id]` and `/my-recipes/[id]`. Triggered by an "Add to plan" button; opens a centered modal (via `createPortal`) with a `table-fixed` weekly calendar grid.

**Props:** `source` ("meal" | "userRecipe"), `recipeId`, `mealType`, `weekStart` (current week YYYY-MM-DD), `weekDays` (7 labels), `todayIndex` (0=Mon…6=Sun), `weekSlots` (full week occupancy from `getWeekSlots`).

**Grid behaviour:**
- Past day columns (index < `todayIndex`) are rendered as narrow 32px hatched strips — no label, no interaction. For "Next week" tab, `effectiveTodayIndex = -1` so no days are past.
- `breakfast` and `snack` meals show 1 row; `lunch` and `dinner` show both Prânz and Cină rows (cross-compatible).
- Cell states: past (hatched strip) | empty (clickable) | self (teal checkmark) | other (warm-tinted, shows meal name).
- Clicking an "other" cell triggers a full-cell Yes/No confirmation split before replacing.
- All cells and columns have fixed dimensions (`h-[72px]` td, `w-[82px]` active / `w-[32px]` past th) with `table-fixed` to prevent layout shift on state transitions.

**Week selector (This week / Next week):** A pill-tab toggle in the modal header lets users switch between the current week and the next. Next week's slots are fetched lazily via `getWeekSlotsAction` (with a spinner) on first switch. Separate local state (`localThisWeekSlots` / `nextWeekSlots`) tracks optimistic updates per week. `doAdd` passes the selected `weekStart` to the server action.

**Supporting infrastructure:**
- `getTodayIndex()` in `src/server/lib/date.ts` — returns 0–6 for the current UTC weekday.
- `getWeekSlots(userId, weekStart)` in `src/server/queries/plans.ts` — returns all planned slots for the week with meal names; used by the widget to determine cell occupancy.
- `getWeekSlotsAction(weekStart)` in `src/server/actions/meal-plan.ts` — authenticated server action wrapper around `getWeekSlots`; used by the widget to lazy-load next week's slots client-side.
- `upsertMealSlot(planId, dayOfWeek, mealType, mealId)` in `src/server/queries/plans.ts` — mirror of `upsertUserRecipeSlot` for seeded meals.
- `addMealToPlanAction(mealId, dayOfWeek, mealType, weekStart?)` in `src/server/actions/meal-plan.ts` — server action for adding seeded meals to the plan; optional `weekStart` defaults to current week.
- `addUserRecipeToPlanAction(recipeId, dayOfWeek, mealType, weekStart?)` — same optional `weekStart` support.
- `AddToPlanButton` (old inline component) was deleted; `AddToPlanWidget` supersedes it entirely.

### Tests
Tests live in `tests/`. `tests/setup.ts` exports `createTestDb()` which creates an **in-memory SQLite DB** (still uses `better-sqlite3`) and applies migrations — use this for integration tests. This is intentionally kept separate from the production Neon driver so tests run offline without network access. Component tests should add `// @vitest-environment jsdom` at the top of the file.

---

## Deployment

### Database — Neon Postgres (Frankfurt)
Production DB is [Neon](https://neon.tech) Postgres, Frankfurt region (`aws-eu-central-1`). The connection string lives in `DATABASE_URL` inside `.env.local` (not committed).

`src/server/db/index.ts` uses `@neondatabase/serverless` + `drizzle-orm/neon-http`. All db scripts (`db:generate`, `db:migrate`, `db:seed`) use `dotenv-cli` to load `.env.local` before execution.

When deploying (e.g. to Vercel), set `DATABASE_URL` as an environment variable pointing to the same Neon connection string.

---

## Simplification Notes (applied 2026-04-14)

The following features were intentionally removed to keep the app simple:

- **No localization** — i18n system removed. All UI is English only. Files `src/lib/i18n.ts`, `src/lib/locale.ts`, `src/server/actions/locale.ts`, and `src/components/layout/LocaleSwitcher.tsx` no longer exist.
- **No dietary tags** — meals and user recipes have no dietary restriction tags. No filtering by diet.
- **No cuisine** — meals and user recipes have no cuisine field.
- **No user cuisine/diet preferences** — `user_preferences` only stores `num_people`.
- **Onboarding** — simplified to a single step: choose number of people.

## Seed Data

The DB currently holds **104 meals** total:
- **19 meals** from the original Săptămâna I Romanian weekly plan — seeded via `npm run db:seed` (`scripts/seed-meals.ts`). Breakdown: 7 breakfast / 6 lunch / 6 dinner.
- **65 meals** extracted from user-provided `.docx` recipe files and inserted via `scripts/seed-extracted-meals.ts` (reads from `recipes/extracted-recipes.json`). This script skips names already in the DB.
- **20 meals** added from a scan of the `.docx` meal plan files in `recipes/WhatsApp Unknown 2026-04-14 at 20.35.38/` that were not covered by the existing 84. Seeded directly via a one-off script (now deleted). Breakdown: 7 breakfast / 6 lunch / 7 dinner. Includes "Halloumi la gratar cu legume proaspete" and other recipes found in the weekly plans.

Run `scripts/fix-meal-types.ts` to repair meal types on existing rows and clear stale weekly plans.

### Shopping List — Romanian Normalisation
`src/lib/shopping-list-utils.ts` normalises ingredient names and units before deduplication so Romanian singular/plural variants aggregate correctly (e.g. "ou" + "ouă" → same entry, "lingură" + "linguri" → same unit). `aggregateInto` always stores the canonical singular form; `formatItem` applies `pluralize()` at display time using `ROMANIAN_PLURALS`.

`normalizeName` applies these preprocessing steps before the canonical name map lookup:
1. Strip parenthetical notes: `\s*\([^)]*\)` removed
2. Strip leading qualifiers (`LEADING_QUALIFIER_RE`): "optional", "opțional", "cca", "circa", "dupa gust", "puțin / puțină", etc.
3. Strip leading quantity-words (`LEADING_QUANTITY_WORD_RE`): "pumn", "mână", "un pumn de", etc.
4. Strip trailing prep-modifier phrases (e.g. "tocat", "rasă", "fiert", "proaspăt") via `TRAILING_PREP_RE`

`expandIngredient(item)` runs before `aggregateInto` and handles compound seasoning strings:
- Strips "dupa gust" / "după gust" and "puțin / putin" prefixes from the name
- If the name contains commas, splits it into multiple `AddableItem`s with `quantity: null, unit: null` (e.g. `"sare, piper, dafin, cimbru"` → 4 items)

Canonical name groupings: "ceapă" (white), "ceapă verde" (spring), and "ceapă roșie" (red) are kept as **separate** canonical forms. All loose-leaf / mixed-greens variants ("frunze salata verde", "mix frunze verzi", "frunze verzi", "salata verde") normalise to **"salată verde"**.
