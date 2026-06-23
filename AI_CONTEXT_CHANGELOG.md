# VitalCore 2.0 — Changelog & AI_CONTEXT additions

## Sleep date fix (revised after testing)
- All 5 sleep read/write sites now consistently key by **wake date**, not
  bedtime date (was off-by-one across logSleep, dashboard, calendar day-detail,
  weekly review, and AI coach prompt).
- **No automatic migration of old data** — by design. Testing showed a
  migration cannot safely tell "old buggy entry" apart from "already-correct
  entry" since they're stored in an identical shape. An automatic shift-by-one
  approach was found (via test) to silently overwrite already-correct sleep
  nights in edge cases. Per your decision: fix forward only. Recommend
  manually re-checking/re-logging the last 2–3 nights after this update.

## Real pre-existing bug found and fixed (unrelated to the 6 requested features)
- `#sleep-date` (the "Last night / 2 nights ago / 3 nights ago" dropdown) had
  its `<option>` children silently wiped on every page load by an unrelated
  init routine that auto-fills date-label badges
  (`querySelectorAll('[id$="-date"]')`, intended for `nutrition-date`,
  `workout-date`, `supp-date`). Because the select's ID also ended in
  `-date`, it matched the same selector and got its content replaced with
  plain text — meaning the dropdown always silently behaved as "Last night"
  regardless of what was selected.
- **Fix:** renamed the element to `sleep-days-ago` so it no longer collides
  with the `-date` badge-fill pattern. `logSleep()` updated to match.
- Found via automated testing (jsdom), not by inspection — worth knowing in
  case similar `-date`-suffixed IDs get added in future features.

## New global localStorage key
- None remaining — the earlier draft introduced `sleepKeyMigrationDone` but
  this was removed along with the migration feature.

## New IndexedDB store (separate from localStorage, mirror-only)
- DB name: `vitalcore_backup`, object store: `kv`
- Mirrors every `save()` call asynchronously for resilience against
  localStorage eviction. localStorage remains the source of truth.

## Exercise form cues + ExRx.net link-out (new)
- Found the Workout > Plan tab already had a fully built weekly split
  (`workoutPlanData`) with sets/reps/focus per day and completion tracking —
  no need to rebuild this, only added cues on top of it.
- Added `exerciseCues` — 30 self-written, general form pointers (not
  certified-trainer-grade instruction) covering every exercise name used in
  `workoutPlanData` and the Log tab's quick-pick buttons. Verified via test:
  every exercise the app can render has a matching cue, none silently fall
  through to "no cue written."
- Each exercise row in the Plan view now has a tappable info icon that
  expands to show the cue + a "Full instructions" link. Same cue shows
  automatically in the active set-logging screen via `ex-active-cue`.
- Link-out goes to a Google search scoped to exrx.net rather than a guessed
  ExRx direct-search URL — ExRx.net's own search page didn't expose a
  documented query-string format that could be verified, so this avoids
  shipping a link that might silently fail.
- **Not done yet (explicitly deferred, tracked for follow-up):** personalizing
  `workoutPlanData` itself to the user's onboarding goals/health profile —
  it's still a fixed Mon-Sun split for everyone, same as before this session.

## Stage 1: Exercise Library tab (new)
- New "Library" tab on the Workout page (Log / Plan / Library / Cardio / History)
- `exerciseLibrary` array: 28 deduplicated, canonical exercises grouped by
  muscle group, each referencing `exerciseCues` by key (single source of
  truth for cue text — not duplicated)
- Searchable via `lib-search` input, filters by name or muscle group

## Stage 3: Friction-reduction features (new localStorage keys)
- `checkin_<date>` — {sleep, soreness, motivation} 1-5 each, morning check-in
- `nutricheck_<date>` — {protein: true/false/null, cals: 'under'/'target'/'over'/null}
- `favoriteMeals` (global array) — saved one-tap meal entries {name,cals,meal,p,c,f}
- No new keys for: repeat-last-session (reads existing `workout_*`), weekly
  review (reads existing data, no new storage), any-data streak (reads
  existing data, no new storage)

## Known UI-state quirk for future AI sessions
- Top-level `const`/`let` declared inside the single `<script>` block are
  NOT accessible as `window.varName` from outside — they're script-scoped,
  not global. Only `function` declarations attach to `window`. This caused
  two false test failures during this session (chasing phantom bugs in
  `workoutPlanData` and `weeklyReviewExpanded`) before being correctly
  identified as a test-access issue, not an app bug. Future debugging should
  drive all state changes through the app's own exposed functions, never by
  reading/writing module-scoped `const`/`let` directly from outside.

## Bug fix: supplements data loss + rest timer removal

### Root cause found and fixed
`defaultSupps` had been reduced to `{morning:[], preworkout:[], bedtime:[]}`
at some point before this session — empty arrays, not the user's real stack.
Every day's supplement list was seeding from this empty default, which is
why the Supplements page appeared blank. Restored the real stack from the
user's saved health profile (MyHealthProfile_v2.md): 5 morning, 4
pre-workout, 1 bedtime supplement.

### Deeper architecture fix (not just a data restore)
The old `getSupps()` always fell back to the hardcoded `defaultSupps` object
for any day with no saved entry — meaning a manually-added supplement would
silently vanish the next day unless the user also edited `defaultSupps` in
code. Fixed by introducing a new persistent global key:

- `userSupplementTemplate` — the user's actual "what I take every day" list.
  Seeded once from `defaultSupps` on first run, then mutated by
  `addSupplement()` / `removeSupplement()`. New days now seed from this
  template (with `taken` reset to false), not from the static `defaultSupps`.
  This means additions/removals are now permanent, as requested, while
  `defaultSupps` itself remains a fixed fallback only used for the very
  first seed.

### New: generic supplements quick-pick
- `genericSupplements` — 12 common, well-known supplements with general/
  typical dosing (explicitly NOT personalized advice — labeled as such in
  code comments). Renders as tap-to-add buttons in the Add Supplement card,
  disables/checkmarks ones already in the user's template.
- `quickAddGenericSupplement(name)` — same persistence behavior as manual add.

### Removed: Rest Timer (kept Stopwatch)
- Deleted the Rest Timer tab/UI from Workout > Log (`timer-rest` div,
  60s/90s/2min/3min buttons) and its three functions (`timerMode`,
  `startRestTimer`, `stopRestTimer`, `updateRestTimerDisplay`) plus a
  pre-existing dead `toggleRestTimer` stub that was never called by anything.
  Stopwatch is untouched and still fully functional — card simplified to a
  single-purpose Stopwatch card (no more mode-switcher tabs needed).

### Known limitation, by user's own choice (not auto-fixed)
If a user already has today's `supps_<date>` saved as empty arrays from
before this fix, `getSupps()` will load that existing (empty) record rather
than reseed, since the record technically exists. User chose NOT to have
this auto-detected/repaired — manual fix if needed: remove that one day's
localStorage key via browser console, e.g.
`localStorage.removeItem('supps_2026-06-20')`, then refresh. All other data
(workouts, food, sleep, history) is unaffected by this.

## Feature: Import AI-generated plan (Option B — no new infrastructure)
Previously "Copy My AI Prompt" was a one-way door: copy prompt, paste into
Claude/Gemini elsewhere, read the response, manually re-enter anything you
wanted to keep. This closes the loop without adding API keys, a backend, or
any external cost.

### Prompt changes
`copyOnboardingPrompt()` now asks for two parts: PART 1 prose (health
considerations, habits, GP checks — kept as readable text, not imported)
and PART 2 a strict JSON block (workoutPlan / meals / supplements) the user
copies back into a new "Paste AI Response" box that appears in the same
plan-overlay card.

### New: `importAiPlan()` and validators
- Per explicit user decision: applies immediately, no preview step.
- BUT validates strictly first — `validateWorkoutPlan`, `validateMeals`,
  `validateSupplements` check types/shapes before anything is written.
  Malformed sub-sections are rejected individually with a specific error
  message (e.g. "sets must be a number, got string") rather than silently
  corrupting data or crashing. A bad `meals` key doesn't block a valid
  `workoutPlan` key — each top-level key is validated and applied
  independently.
- `extractJsonFromPaste()` handles the AI response whether or not it
  includes the ```json code fence.

### New persistence: `aiImportedWorkoutPlan`, `aiImportedMeals` (global keys)
`workoutPlanData` and `mealModules` are static `const` with no built-in
storage — importing only mutates them in-memory, which would silently
revert on every page reload if left as-is. Added
`applyPersistedAiPlanOverrides()`, called at the very start of
`DOMContentLoaded`, which re-applies any saved AI import on every load
before anything renders. Supplements didn't need this — they already go
through `userSupplementTemplate`, which persists naturally.

### Important tagging detail for future maintainers
Imported meals are tagged with the user's OWN current goal/health tags
(read via `getRelevantUserTags()` at import time), not a generic
`'ai-imported'` tag. A generic tag would never match any real user tag in
`renderMealPlan()`'s scoring loop, so the imported meal would almost never
be selected — verified by test that this was a real bug before the fix.
On a tied score, existing built-in meals still win (checked first, strict
`>` comparison) — imported meals aren't artificially privileged, they only
surface when they genuinely match the user's profile better than anything
built in.

## sw.js: fixed silent stale-version bug (irregular update schedule)

### The actual bug
Original `sw.js` used pure cache-first for ALL requests, including
`index.html`. Once cached under `CACHE_NAME='vitalcore-v2'`, every future
visit served that same cached copy forever — network was never even
consulted — until `CACHE_NAME` was manually bumped in a future deploy. Since
updates happen irregularly ("whenever possible," not on a schedule), this
meant friends could silently keep using an old/broken version indefinitely
with zero indication anything was wrong, and the developer would have no
way to know without asking them directly.

### The fix
`index.html` / navigation requests now use network-first with a 3-second
timeout (`fetchWithTimeout`, `isFreshnessSensitive`): try the network, and
if a response arrives within 3s, use it AND cache it for next time. If the
network is slow or unavailable, fall back to whatever's cached — so the app
still works offline, just without forcing a stale version when online.
Icons and manifest.json keep the original cache-first behavior unchanged,
since those rarely change and don't benefit from a freshness check on every
load.

This means: deploy whenever, no version-number bookkeeping required —
anyone with a network connection automatically picks up the latest deploy
on their next load. `CACHE_NAME` bumped v2→v3 once, for this deploy only,
to purge anyone's existing stale-cached `index.html` from the old buggy
behavior.

Verified via test: 13 checks covering routing logic, timeout behavior under
fast/slow/offline network conditions, and full fetch-handler simulation for
both the freshness-sensitive and cache-first code paths.
