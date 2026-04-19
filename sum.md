# Pathon — Complete Project Summary

> Everything about this project. What it is, how it works, what every file does,
> what every AI module does, how the UI looks, what is built, what is planned.
> Use this to onboard a new session, brief a new AI, or remember where everything lives.

---

## What Pathon Is

Pathon is a career intelligence system — not a job board, not a résumé tool, not a dashboard with metrics. It is a structured reasoning environment where a person inputs who they are, what they know, and where they want to go, and the system reasons back with career paths, skill gaps, behavioral observations, interview preparation, and an AI mentor that actually challenges them.

The design philosophy: treat the user as a long-term evolving professional, not a session-based question-asker. Everything accumulates. The system gets smarter as it knows more about the person.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 — App Router (TypeScript) |
| Auth | Supabase magic link (PKCE flow) via `@supabase/ssr` |
| Database | Supabase Postgres — Row Level Security on all tables |
| AI model | Anthropic `claude-opus-4-6` — all AI calls |
| 3D (entry + skills) | Three.js + `@react-three/fiber` v9 + `@react-three/drei` v10 |
| Fonts | Fraunces (display serif, headings, italics) + Georgia (body) + DM Mono (labels/data) |
| Styling | Tailwind CSS + inline styles throughout — Georgia serif base |
| Animation | CSS keyframes (no Framer Motion currently) |
| PDF parsing | `pdfjs-dist` dynamic import with `canvas = false` alias |

---

## Design System

### Color palette

| Token | Hex | Used for |
|---|---|---|
| Background | `#0e0e0f` | Page backgrounds, universal |
| Text primary | `#c4bfb8` / `#c8c3bc` | Readable body, main content |
| Text dim | `#8a8480` | Secondary labels, metadata |
| Text mid | `#5a5754` | Muted body, sidebar items |
| Text very dim | `#3a3836` | Labels, section dividers |
| Text whisper | `#252321` | Stage watermarks, decorative labels |
| Text ghost | `#1e1e20` | Barely-visible hints |
| Border dark | `#161618` | Card grid separators |
| Border faint | `#1a1a1c` | Subtle rule lines |
| Border mid | `#252321` | Hovered borders, chip outlines |
| Surface raised | `#111113` | Card backgrounds on hover |
| Surface deep | `#090909` | The Mirror section background |
| Copper accent | `#8a6a42` | Primary CTAs — one per screen maximum |
| Complete green | `#4a6258` | Completion states, active pursuits |
| Complete green dim | `#2d4039` | Completion borders, dot accents |
| Architect amber | `#c4a882` | Debate persona — The Architect |
| Challenger slate | `#7a9aaa` | Debate persona — The Challenger |

### Typography

- **Fraunces** — display serif, always italic, always light weight (300). Used for: hero headlines, page titles, pull quotes, dashboard career direction, path names, scenario prompts, mentor sidebar path names. Creates editorial gravitas.
- **Georgia** — body serif. Used for: body text, labels, buttons, navigation, all prose content. Base font of the app.
- **DM Mono** — monospaced, 300 weight. Used for: card index numbers (`01`, `02`), keyboard shortcut hints (`⌘K`), small data labels.

### Font sizes (actual pixel values at 16px base)

| Use | Size | Actual |
|---|---|---|
| Hero headline | `clamp(1.9–2.75rem)` | 30–44px |
| Path/section title | `clamp(1.5–2.25rem)` | 24–36px |
| Pull quote | `clamp(1.1–1.4rem)` | 18–22px |
| Body | `1rem` | 16px |
| Secondary body | `0.9–0.95rem` | 14–15px |
| Labels/caps | `0.65–0.72rem` | 10–11px |
| Stage watermarks | `0.58–0.65rem` | 9–10px |

### Spacing philosophy

Generous whitespace. Most sections have `5–8rem` of vertical breathing room. Cards use `1.75–2rem` internal padding. Section headers maintain `4–5rem` below them. Nothing is crowded. The emptiness is intentional.

### Motion

- **Page reveals**: Fade-in + 8px translate-Y via `PageReveal` wrapper (double `requestAnimationFrame`)
- **Thinking dots**: Three dots with `thinkBob` keyframe animation (opacity + 5px translateY, 1.5s cycle, staggered 0.18s)
- **Card stagger**: `cardReveal` keyframe on dashboard cards, 0.05s delay increments
- **Debate turns**: `debateReveal` keyframe — each turn fades in as it's revealed
- **Stage nav**: CSS transition on opacity + transform for hover labels
- **TopNav menu**: Opacity transition (0.22s ease) on the full-screen overlay
- **Skill constellation**: Three.js ambient Y-rotation, pauses on hover, edge lines appear on node hover
- **Entry canvas**: Three.js icosahedron wireframe + point cloud + mouse parallax (camera lerps toward cursor)
- **SVG paths divergence**: Scroll-driven bezier curves, IntersectionObserver reveals on path sections

### Grain texture

Applied via `body::before` — fixed, `z-index: 9999`, pointer-events none, opacity 0.045. SVG `feTurbulence` fractalNoise data URI, 300×300px repeat. Gives the dark background analog texture.

---

## Folder Structure

```
Pathon/
├── app/
│   ├── page.tsx                    Entry — magic link auth + 3D canvas
│   ├── layout.tsx                  Root — TopNav + StageNav + CommandPalette
│   ├── globals.css                 All styles, design tokens, keyframes
│   ├── dashboard/
│   │   ├── page.tsx                Dashboard hub — stage grid, progress spine, patterns
│   │   └── loading.tsx             Loading state
│   ├── identity/
│   │   └── page.tsx                20-question identity flow
│   ├── credentials/
│   │   └── page.tsx                Resume / GitHub / projects intake
│   ├── paths/
│   │   ├── page.tsx                AI career path analysis (cached)
│   │   └── loading.tsx             Loading state (AI call can take 5-15s)
│   ├── mentor/
│   │   ├── page.tsx                AI shadow mentor chat
│   │   └── debate/
│   │       └── page.tsx            The Debate — two AI personas argue
│   ├── proof/
│   │   ├── page.tsx                Proof capsule list
│   │   ├── new/page.tsx            New capsule
│   │   └── [id]/
│   │       ├── page.tsx            View capsule
│   │       └── edit/page.tsx       Edit capsule
│   ├── skills/
│   │   └── page.tsx                3D skill constellation
│   ├── interview/
│   │   ├── page.tsx                Interview prep (server — generates STAR stories)
│   │   └── InterviewClient.tsx     Tab UI — STAR stories + role fit analyzer
│   ├── check-in/
│   │   └── page.tsx                Weekly 3-question reflection
│   ├── actions/
│   │   ├── paths.ts                recordResponse() server action
│   │   ├── interview.ts            getRoleFit() server action
│   │   ├── debate.ts               runDebate() server action
│   │   └── checkin.ts              submitCheckIn() server action
│   └── api/
│       └── mentor/route.ts         Streaming API route for mentor chat
│
├── components/
│   ├── layout/
│   │   ├── TopNav.tsx              Persistent frosted-glass top bar + full-screen menu
│   │   ├── StageNav.tsx            Fixed left-edge 5-dot progress indicator
│   │   ├── CommandPalette.tsx      Cmd+K modal — 10 routes, arrow key nav, query filter
│   │   ├── PageReveal.tsx          Fade-in wrapper (opacity + translateY)
│   │   ├── EntryScreen.tsx         Landing — hero, stage explainer, magic link form
│   │   ├── EntryCanvas.tsx         Three.js icosahedron + particles + mouse parallax
│   │   ├── FlowShell.tsx           Server→Client context bridge (onComplete pattern)
│   │   └── AuthProvider.tsx        Supabase auth context
│   │
│   ├── identity/
│   │   ├── IdentityFlow.tsx        20-step form (orientation screen, progress bar, watermark)
│   │   ├── IdentityFlowConnected.tsx  FlowShell bridge
│   │   ├── CareerPathViz.tsx       Scroll-driven career path narrative (4 sections)
│   │   ├── PathsContinue.tsx       Fixed "continue →" overlay on paths page
│   │   ├── MentorInterface.tsx     Streaming mentor chat UI
│   │   ├── DebateInterface.tsx     Two-persona debate UI with sequential reveal
│   │   └── SkillConstellation.tsx  3D R3F skill graph
│   │
│   └── credentials/
│       ├── CredentialIntake.tsx    Resume / GitHub / projects form
│       ├── CredentialIntakeConnected.tsx
│       ├── ProofList.tsx           Capsule list with completeness rings
│       ├── ProofCapsuleEditor.tsx  6-section editor with autosave
│       ├── ProofCapsuleEditorConnected.tsx
│       ├── ProofCapsuleViewer.tsx  Read-only capsule display
│       └── ProofViewerShell.tsx    Injects onEdit
│
├── lib/
│   ├── ai/
│   │   ├── context.ts              buildCareerContext(userId) — assembles CareerContext
│   │   ├── decisions.ts            generateCareerPaths(context) — 2-3 path analysis
│   │   ├── mentor.ts               askMentor() + streamMentor() — AI chat
│   │   ├── skills.ts               buildSkillNodes(identity, analysis) — pure transform
│   │   ├── interview.ts            generateSTARStories() + analyzeRoleFit()
│   │   ├── checkin.ts              processCheckIn(context, answers) — weekly reflection
│   │   ├── debate.ts               generateDebate(context, dilemma, patterns)
│   │   └── constraints.ts          Safety/honesty guardrails injected into every prompt
│   │
│   ├── db/
│   │   ├── client.ts               Supabase browser client
│   │   ├── server.ts               Supabase server client (SSR)
│   │   ├── memory.ts               saveSnapshot, loadMemory, recordPathResponse, logEvent
│   │   └── proof.ts                listProofCapsules, getProofCapsule, etc.
│   │
│   └── auth/
│       ├── session.ts              getUser() — server-validates, never getSession()
│       ├── actions.ts              signInWithMagicLink()
│       ├── flow.ts                 requireStage(), nextRoute() — sequential stage gating
│       └── index.ts                Re-exports
│
└── types/
    ├── identity.ts                 CareerIdentity + all enum types (ThinkingStyle etc.)
    ├── context.ts                  CareerContext — the universal AI input type
    ├── decisions.ts                CareerPath, CareerPathAnalysis
    ├── memory.ts                   PathSnapshot, PathResponse, BehaviorEvent, ObservedPattern
    ├── mentor.ts                   MentorMessage, MentorInput, MentorResponse
    ├── skills.ts                   SkillNode, SkillStatus
    ├── credentials.ts              Credentials, ProjectDescription
    ├── proof.ts                    ProofCapsuleRecord, ProofCapsuleInsert
    └── database.ts                 Supabase generated types
```

---

## Database Schema

### Tables

**`career_identity`** — One row per user. 25+ fields covering cognitive style, learning mode, work rhythm, values, skills, career stage, and direction. Notable: `"current_role"` must be quoted in SQL (reserved word).

**`credentials`** — Resume text (extracted from PDF or pasted), GitHub URL, project descriptions (JSONB array). One row per user, upserted on save.

**`path_snapshots`** — Append-only. One row per AI invocation of `generateCareerPaths`. Stores the full `CareerPathAnalysis` as JSONB. Never mutated after insert. Used to avoid re-calling AI on page refresh.

**`path_responses`** — Append-only. Records what the user did with each suggested path: `pursuing | considering | deferred | dismissed`. One row per action, multiple rows per path over time.

**`behavior_log`** — Observable event timeline. Every significant user action (path pursued, dismissed, identity updated, direction changed, etc.) is logged here. Used by pattern detection and mentor context.

**`proof_capsules`** — Structured decision records. Six sections: claim, context, constraints, decision_reasoning, iterations, reflection. `is_complete` boolean. Append-only revisions tracked in `proof_revisions`.

**`proof_revisions`** — Append-only history of capsule edits. Never deleted.

### Migration files (run in order in Supabase SQL Editor)

```
supabase/migrations/000_career_identity.sql
supabase/migrations/001_credentials.sql
supabase/migrations/002_career_state_memory.sql
supabase/migrations/003_proof_capsules.sql
```

---

## Routes Map

| Route | Type | Auth | Purpose |
|---|---|---|---|
| `/` | Client | No | Entry — magic link form + 3D canvas |
| `/dashboard` | Server | Auth | Hub — all stages, progress spine, patterns |
| `/identity` | Server | Auth | 20-question identity flow |
| `/credentials` | Server | Auth + Identity | Resume/GitHub/projects intake |
| `/paths` | Server | Auth + Identity | AI career path scroll narrative |
| `/mentor` | Server | Auth + Identity | Streaming AI mentor chat |
| `/mentor/debate` | Server | Auth + Identity | Two-persona debate interface |
| `/proof` | Server | Auth + Identity | Proof capsule list |
| `/proof/new` | Server | Auth + Identity | Create new capsule |
| `/proof/[id]` | Server | Auth + Identity | View capsule |
| `/proof/[id]/edit` | Server | Auth + Identity | Edit capsule |
| `/skills` | Server | Auth + Identity | 3D skill constellation |
| `/interview` | Server | Auth + Identity | STAR stories + role fit |
| `/check-in` | Client | Auth | Weekly reflection |
| `/api/mentor` | API Route | Auth | Streaming mentor endpoint |
| `/auth/callback` | Handler | — | Supabase PKCE callback |

---

## AI Modules

### `buildCareerContext(userId)` — `lib/ai/context.ts`

The single entry point for assembling everything known about a user. Fetches `career_identity`, `credentials`, and completed `proof_capsules` in parallel. Returns a `CareerContext` object — the only thing passed to any AI call. Raw DB rows never reach the AI layer.

### `generateCareerPaths(context)` — `lib/ai/decisions.ts`

Generates 2–3 career path analyses. Uses `claude-opus-4-6` with `max_tokens: 4096`. Input: `CareerContext`. Output: `CareerPathAnalysis` with `paths`, `observations`, `missing_context`. Results are cached in `path_snapshots` — the AI is NOT called if a snapshot already exists for that user.

Each path contains:
- `name` — concrete direction label
- `fit_reasoning` — why it fits THIS person (no generic framing allowed)
- `gaps[]` — specific missing skills/experience
- `time_to_readiness` — honest range estimate
- `risk_assessment` — structural and personal risks, not softened
- `what_to_avoid[]` — specific to this person
- `alignment` — `aligned | partial | misaligned`

### `streamMentor(context, memory, input, onChunk)` — `lib/ai/mentor.ts`

Streaming AI career mentor. System prompt includes: full serialized `CareerContext`, serialized `CareerStateMemory` (pursuits, dismissals, patterns, recent events). The mentor is instructed to challenge weak reasoning, reference past decisions, name tradeoffs, and NOT agree automatically. Persona is calibrated to the user's `feedback_preference` field. Returns stream chunks via `onChunk` callback.

### `buildSkillNodes(identity, analysis)` — `lib/ai/skills.ts`

Pure transform — no AI call. Derives `SkillNode[]` from identity data and path analysis. Three statuses: `owned` (from knowledge_domains + strengths), `exploring` (from currently_exploring), `gap` (from path gaps not already owned). Each node gets a `leverage` score (0–1) based on foundational-skill set and gap frequency across paths. Edge connections built from shared meaningful words between labels.

### `generateSTARStories(context)` — `lib/ai/interview.ts`

Maps proof capsules to STAR interview format. Capsule sections → Situation (claim+context), Task (constraints), Action (reasoning+iterations), Result (reflection). Returns `STARStory[]` with `best_for` (the behavioral question category each story answers best) and `interview_gaps[]` (question categories not yet covered).

### `analyzeRoleFit(context, jobDescription)` — `lib/ai/interview.ts`

Compares a pasted job description to the user's profile. Returns: `alignment_score` (strong/partial/weak), `what_fits[]`, `gaps_for_role[]`, `relevant_capsules[]` (verbatim claim text), `red_flags[]`, `verdict` (one direct sentence).

### `processCheckIn(context, answers)` — `lib/ai/checkin.ts`

Three questions in, one response out. Questions: what happened this week, what gave/drained energy, what to move on next week. AI returns: a 2–4 sentence reflection (under 120 words) + one `sharpening_question` to carry into next week.

### `generateDebate(context, dilemma, patterns)` — `lib/ai/debate.ts`

Two AI advisor personas argue a user's career dilemma. The Architect (long-horizon, strategic, warm amber) and The Challenger (market-hardened, execution-focused, cool slate). 6 turns total (3 each), generated in one call. Mirror paragraph generated in a parallel call from behavioral patterns. Both calls run simultaneously via `Promise.all`. Returns: `turns: DebateTurn[]` + `mirror: string`.

### `applyConstraints(systemPrompt)` + `validateOutput(text)` — `lib/ai/constraints.ts`

Every AI call in the system wraps its system prompt with `applyConstraints()`. The constraint block prohibits: guaranteed outcome language, absolute trait claims, agency-removal directives, unsourced inference presented as fact. `validateOutput()` runs post-generation heuristic scan on the response text. Violations are logged but do not hard-block (the scanner is heuristic, not perfect).

---

## Memory System — `lib/db/memory.ts`

### What it tracks

**`path_snapshots`** — every AI analysis ever generated for the user. Newest first. Includes full `CareerPathAnalysis` JSONB.

**`path_responses`** — every path response. Actions: `pursuing | considering | deferred | dismissed`. Multiple rows per path over time (append-only).

**`behavior_log`** — discrete observable events. Not interpreted — just recorded. Event types: `analysis_generated`, `path_pursued`, `path_dismissed`, `path_deferred`, `advice_ignored`, `direction_changed`, `identity_updated`, `credentials_updated`, `path_revisited`.

### What it computes (in application code, not SQL)

- **Active pursuits** — paths where the latest action is `pursuing`
- **Dismissed paths** — paths where the latest action is `dismissed`
- **Patterns** — detected from event log:
  - `recurring_dismissal` — dismissed 2+ aligned paths
  - `repeated_deferral` — 2+ paths deferred and never returned to
  - `direction_instability` — career direction changed 2+ times
  - `low_engagement` — 2+ analyses with zero responses
  - `pursuit_commitment` — marked pursuing and sustained 14+ days

---

## Feature Inventory — Fully Built

### Navigation
- **TopNav** — persistent 48px frosted-glass bar (backdrop-blur). Pathon wordmark → dashboard. Current page name centered. `≡` opens full-screen menu with all 10 routes in two groups. Escape closes. CSS transition.
- **StageNav** — 5 vertical dots (40×40px click targets), 1px spine connecting them. Current stage = 18px white horizontal bar with glow. Completed = 7px dim dot. Future = 5px ghost dot. Labels slide in on hover.
- **CommandPalette** — Cmd+K / Ctrl+K modal. 10 entries with descriptions. Arrow key navigation. Query filtering. Enter to navigate.

### Identity Flow `/identity`
- 20-question flow. Enums (select from options), text, and multi-tag inputs.
- Orientation screen: "Twenty questions…" full-screen moment, auto-advances after 3.2s.
- Progress bar: 1px rule at top of screen, grows with each question.
- Stage watermark: ultra-dim "identity" top-right.
- Saves to `career_identity` via upsert on completion.

### Credentials `/credentials`
- PDF upload (pdfjs-dist dynamic import) or paste raw resume text.
- GitHub URL field.
- Project descriptions list (title + description pairs).
- Saves to `credentials` via upsert.

### Career Paths `/paths`
- AI call cached — `getLatestSnapshot()` checked first, AI only called if no existing snapshot.
- Loading state: `app/paths/loading.tsx` shown during generation.
- **Section 1 — Intro**: Alignment pills (aligned/partial/misaligned dots + labels), Fraunces italic path count title (one/two/three paths), scroll-down hint line.
- **Section 2 — Divergence**: 220vh sticky container. SVG bezier curves fan from origin as user scrolls. Path name labels fade in when scroll progress > 0.75.
- **Section 3 — Per-path chapters**: Each path is a full section. Pull quote (`fit_reasoning` in Fraunces italic with colored left border). Runway bar for time-to-readiness (width mapped from text content). Gap chips (outlined inline chips, not dash lists). Risk and avoid in italic. Response buttons: pursuing/considering/defer/not this → server action → `path_responses` + `behavior_log`.
- **Section 4 — Observations**: Left-border paragraphs, observations + missing context.

### Dashboard `/dashboard`
- Career direction as hero Fraunces italic pull quote.
- Progress spine: 5 nodes on horizontal line, labeled, connected by 1px rule.
- 7-card grid with SVG completion rings (animated arc), card stagger animation, Fraunces italic for completed summaries, `0{n}` DM Mono index numbers, "continue →" with sliding arrow on next-to-complete card.
- Active pursuits section (green dots, Fraunces italic path names).
- Behavioral patterns section (left-border quotes from pattern engine).

### Mentor `/mentor`
- Streaming response via `/api/mentor` route.
- Right-aligned Fraunces italic user messages.
- AI responses: left-rule, paragraph-by-paragraph sequential reveal (500ms fade + 420ms pause between paragraphs).
- Thinking dots: 3 animated dots during generation.
- Scenario prompts: 5 opinionated starting scenarios with border-left hover style.
- Paths sidebar: toggles from right with slide transition. Shows career paths with alignment color and Fraunces italic names.
- "debate ✦ →" link to debate page.
- Forward nav to `/proof` after first exchange.

### The Debate `/mentor/debate`
- Dilemma textarea (Fraunces italic, auto-resize, `⌘↵` shortcut).
- Persona preview cards shown before debate starts.
- Both personas show thinking dots during generation.
- Turns reveal one-at-a-time with 900ms delay between each — while waiting, the "next speaker" shows their thinking dots.
- The Architect column: amber top border. The Challenger column: slate top border.
- After all 6 turns: **The Mirror** fades in — one paragraph from the user's behavioral patterns, no advice, only observation.
- Reset button to start new dilemma.

### Skills Constellation `/skills`
- 3D canvas via `@react-three/fiber` v9 + `@react-three/drei` v10 (React 19 compatible).
- Nodes positioned by deterministic hash of label (same input = same position every time).
- Size → leverage score. Opacity → relevance. Color → owned (off-white) / exploring (teal) / gap (dim brown).
- High-leverage nodes pulled toward center. Edge lines appear on hover (to related nodes).
- Ambient Y-rotation pauses when mouse is over canvas.
- Legend overlay: encoding key for size/opacity/color.
- `buildSkillNodes()` is pure — no AI call, instant load.

### Interview Prep `/interview`
- STAR stories generated server-side from proof capsules.
- Two tabs: "star stories" and "role fit".
- STAR tab: expandable cards. Collapsed = capsule claim. Expanded = S/T/A/R breakdown + `best_for` label. Gap coverage list below.
- Role fit tab: paste JD textarea → `analyzeRoleFit()` via server action → alignment score dot, verdict pull quote, two-column detail (what fits + relevant proof | gaps + red flags).

### Proof Capsules `/proof` `/proof/new` `/proof/[id]` `/proof/[id]/edit`
- 6-section editor: claim, context, constraints, decision_reasoning, iterations, reflection.
- Section dot navigation + keyboard shortcuts.
- 1500ms debounce autosave. Revision history saved to `proof_revisions`.
- Completeness ring per capsule in list (SVG arc, 6 sections = 100%).
- First-visit animated explanation of what a proof capsule is.
- Viewer: read-only display + edit link.

### Check-in `/check-in`
- Three text areas (what happened, energy, next week focus).
- `submitCheckIn()` server action → `processCheckIn()` → 2–4 sentence reflection + one sharpening question.
- After submit: AI response in Fraunces italic + sharpening question displayed as italic pull.
- "← start over" resets the form.

---

## Component Architecture

### Server / Client Split

Server Components handle all data fetching (auth, DB, AI). They never use `useState`, `useEffect`, or event handlers. Client Components handle interaction.

**FlowShell pattern**: Server Component pages pass serializable JSX children (not functions) to `FlowShell`. FlowShell provides `onComplete` via React Context. Connected wrapper components read from context via `useFlowComplete()`. This solves the "Functions are not valid as a child of Client Components" error that breaks if you try to pass callbacks across the Server/Client boundary.

Connected wrappers: `IdentityFlowConnected`, `CredentialIntakeConnected`, `ProofCapsuleEditorConnected`.

### Key patterns

**`requireStage(stage)`** — called at the top of every protected server page. Checks auth via `getUser()` (server-validates, never `getSession()`). For all stages after identity, checks that identity exists. Redirects to `/` or `/identity` if not.

**`buildCareerContext(userId)`** — the universal AI input assembler. Called by all AI-invoking pages. Never passes raw DB rows to AI.

**Snapshot caching** — `getLatestSnapshot(userId)` checked before every AI paths call. AI only called if no snapshot exists. Saves money and load time.

**Append-only writes** — `path_snapshots`, `path_responses`, `behavior_log`, `proof_revisions` are never updated or deleted. New rows record new state.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

---

## Known Fixes Applied This Project

| Problem | Root cause | Fix |
|---|---|---|
| `current_role` Postgres error | Reserved SQL keyword | Quoted as `"current_role"` in migration |
| R3F crash (ReactCurrentOwner) | R3F v8 incompatible with React 19 | Upgraded to `@react-three/fiber` v9 + `@react-three/drei` v10 |
| FlowShell "Functions not valid as child" | Callbacks crossed Server/Client boundary | Changed to Context provider pattern with Connected wrappers |
| AI JSON truncated | `max_tokens: 2048` too small | Increased to 4096 |
| AI response wrapped in code fences | Model formatting behavior | Parser: regex fence match + first`{`/last`}` fallback |
| pdfjs-dist canvas error | Missing canvas alias | `config.resolve.alias.canvas = false` in next.config.ts |
| API called on every refresh | No caching | `getLatestSnapshot()` checked first, AI only if no snapshot |
| 3D camera looking wrong direction | Camera at z=8, paths at +Z | Replaced 3D viz with scroll-driven SVG |
| `Something went wrong` on identity save | Supabase migrations not run | User ran migrations manually in SQL Editor |
| Dashboard event handlers in Server Component | `onMouseEnter` in Server Component | Replaced with CSS `.dashboard-block:hover` class |

---

## What Is Planned / Not Yet Built

From the feature roadmap (in priority order):

1. **Anti-Recommendation System** — a fourth section in career paths analysis: "What the system recommends you do NOT pursue" with specific behavioral reasoning
2. **Career Mode Switching** — four modes (Explore / Build / Recover / Reflect) that change mentor tone, dashboard emphasis, and recommendation framing
3. **Decision Memory** — mentor actively references past choices: "Last time you said X. It's been 6 weeks. What happened?"
4. **Regret Simulation** — before marking a path as "pursuing," modal shows AI simulation of user 18 months later (what you might regret, what might go right)
5. **Skills constellation upgrades** — flickering nodes for decaying skills, leverage score shown on hover, animated SVG dependency lines
6. **Daily execution card** — one micro-action on the dashboard each day, derived from active pursuit
7. **Friction detection** — same action deferred 3+ check-ins → system flags it and suggests reconsidering the path
8. **Career Story Generator** — all data → first-person narrative essay about the user's professional arc
9. **The Mirror Mode** — one-time "see yourself as the AI sees you" experience, no reassurance
10. **Offer Evaluator** — paste a job offer → deep analysis vs active paths + stated values
11. **Reality Layer / Market Signals** — job posting trend data, skill demand velocity, saturation warnings
12. **Proof Evolution** — re-evaluate a capsule with current skill level, show growth delta
13. **Failure Archive** — dedicated section for explicit failure records, pattern extraction

---

## Session Recovery Instructions

If a session ends and you need to brief a new Claude session:

1. Share this file
2. Share `PROGRESS.md` for the granular build log
3. Name the specific feature to continue from the "Planned / Not Yet Built" list above
4. All architecture decisions, DB schemas, and type contracts are documented here — no re-derivation needed

The most important architectural rules to never break:
- All AI calls receive `CareerContext` — never raw DB rows
- All writes to memory tables are append-only — never update or delete
- Server Components fetch, Client Components interact — never mix
- `getUser()` for auth — never `getSession()`
- `requireStage()` at the top of every protected page
