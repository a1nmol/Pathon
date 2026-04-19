# Pathon — Build Progress

> This file is the single source of truth for everything built, in-progress, and planned.
> Updated after every completed feature. Use this to resume work in any future session.

---

## Tech Stack

- **Framework**: Next.js 15 App Router (TypeScript)
- **Auth**: Supabase magic link (PKCE flow) — `@supabase/ssr`
- **DB**: Supabase Postgres — Row Level Security on all tables
- **AI**: Anthropic SDK — `claude-opus-4-6`
- **3D**: `three`, `@react-three/fiber` v9, `@react-three/drei` v10
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS + inline styles (Georgia serif base)
- **PDF parsing**: `pdfjs-dist` (dynamic import, canvas alias = false)
- **Fonts**: Fraunces (display serif, headings) + Georgia (body) + DM Mono (labels/data)

---

## Architecture Rules

- Server Components for all data fetching (auth, DB)
- Client Components for interactivity — connected via Context (FlowShell pattern)
- `getUser()` for auth (server-validates — never `getSession()`)
- `CareerContext` is the single normalized object passed to ALL AI — never raw DB rows
- Append-only DB tables for memory and proof revisions (no update/delete RLS)
- `requireStage(stage)` guards all protected pages — redirects if missing auth/identity

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `career_identity` | User's cognitive/career profile (25+ fields) |
| `credentials` | Resume text, GitHub URL, project descriptions |
| `path_snapshots` | Every CareerPathAnalysis output (append-only) |
| `path_responses` | User reactions to suggested paths (pursuing/considering/dismissed/deferred) |
| `behavior_log` | Observable events timeline |
| `proof_capsules` | Structured decision records (claim/context/constraints/reasoning/iterations/reflection) |
| `proof_revisions` | Append-only revision history for each capsule |

**Migration files**: `supabase/migrations/` (run in order 000→003 in Supabase SQL Editor)
- `000_career_identity.sql` — NOTE: `"current_role"` must be quoted (reserved word)
- `001_credentials.sql`
- `002_career_state_memory.sql`
- `003_proof_capsules.sql`
- `20260416000004_linkedin_data.sql` — `linkedin_data` table with positions/skills/posts/education JSONB columns

---

## Routes

| Route | Purpose | Auth Required |
|-------|---------|--------------|
| `/` | Entry (magic link) or redirect to dashboard | No |
| `/identity` | 20-question identity flow | Auth |
| `/credentials` | Resume/GitHub/projects intake | Auth + Identity |
| `/paths` | AI career path visualization (scroll narrative) | Auth + Identity |
| `/mentor` | AI shadow mentor chat | Auth + Identity |
| `/proof` | Proof capsule list | Auth + Identity |
| `/proof/new` | Create new capsule | Auth + Identity |
| `/proof/[id]` | View capsule | Auth + Identity |
| `/proof/[id]/edit` | Edit capsule | Auth + Identity |
| `/dashboard` | Home base — stage status + next action | Auth |
| `/skills` | 3D Skill Constellation | Auth + Identity |
| `/interview` | Interview prep (STAR stories + role fit) | Auth + Identity |
| `/check-in` | Weekly 3-question reflection | Auth + Identity |
| `/mentor/debate` | Two AI personas debate a career dilemma | Auth + Identity |
| `/story` | First-person career narrative generator | Auth + Identity |
| `/offer` | Job offer evaluator | Auth + Identity |
| `/failures` | Private failure archive (localStorage) | No |

---

## AI Modules

| File | Function | Purpose |
|------|----------|---------|
| `lib/ai/context.ts` | `buildCareerContext(userId)` | Assembles CareerContext from DB |
| `lib/ai/decisions.ts` | `generateCareerPaths(context)` | Generates 2-3 career paths |
| `lib/ai/mentor.ts` | (streaming) | AI shadow mentor conversation |
| `lib/ai/skills.ts` | `buildSkillNodes(identity, analysis)` | Pure transform — no AI call |
| `lib/ai/constraints.ts` | `applyConstraints(prompt)` | Safety/honesty guardrails |
| `lib/ai/interview.ts` | `generateSTARStories(context)` | STAR interview prep from capsules |
| `lib/ai/interview.ts` | `analyzeRoleFit(context, jd)` | Job description fit analysis |
| `lib/ai/checkin.ts` | `processCheckIn(context, answers)` | Weekly reflection AI (3 questions → response + sharpening question) |
| `lib/ai/daily.ts` | `generateDailyAction(params)` | One concrete micro-action for today from active pursuit |
| `lib/ai/story.ts` | `generateCareerStory(context, memory)` | First-person narrative essay (350–500 words) |
| `lib/ai/offer.ts` | `evaluateOffer(context, memory, text)` | Job offer analysis vs paths + values |
| `lib/ai/debate.ts` | `generateDebate(context, dilemma, patterns)` | Two-persona debate with parallel AI generation |

---

## Component Map

### Layout
- `components/layout/AuthProvider.tsx` — Supabase auth context provider
- `components/layout/FlowShell.tsx` — Context bridge (Server→Client for onComplete callbacks)
- `components/layout/StageNav.tsx` — Fixed left-edge dots navigation (5 stages)
- `components/layout/EntryScreen.tsx` — Hero + 3D canvas + auth form
- `components/layout/EntryCanvas.tsx` — Three.js icosahedron wireframe + particles (mouse parallax)
- `components/layout/CommandPalette.tsx` — Cmd+K modal for quick navigation
- `components/layout/PageReveal.tsx` — Fade-in wrapper for page transitions

### Identity Flow
- `components/identity/IdentityFlow.tsx` — 20-step flow (progress bar, stage watermark, orientation screen)
- `components/identity/IdentityFlowConnected.tsx` — Context bridge wrapper

### Career Paths
- `components/identity/CareerPathViz.tsx` — Scroll-driven narrative (intro → SVG divergence → per-path chapters → observations → path response buttons)
- `components/identity/PathsContinue.tsx` — Fixed "continue →" overlay

### Skills
- `components/identity/SkillConstellation.tsx` — 3D R3F constellation (owned/exploring/gap nodes)

### Mentor
- `components/identity/MentorInterface.tsx` — Streaming AI chat (paragraph reveals, paths sidebar, forward nav)

### Credentials / Proof
- `components/credentials/CredentialIntake.tsx` — Resume/GitHub/projects form
- `components/credentials/CredentialIntakeConnected.tsx` — Context bridge
- `components/credentials/ProofCapsuleEditor.tsx` — 6-section writing editor (autosave, revisions)
- `components/credentials/ProofCapsuleEditorConnected.tsx` — Context bridge
- `components/credentials/ProofCapsuleViewer.tsx` — Read-only capsule display
- `components/credentials/ProofViewerShell.tsx` — Injects onEdit via cloneElement
- `components/credentials/ProofList.tsx` — Capsule list (completeness rings, first-visit explanation)

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

---

## Completed Features

### Foundation
- [x] Next.js 15 App Router scaffold (TypeScript, Tailwind, Framer Motion)
- [x] Supabase magic link authentication (PKCE flow)
- [x] `requireStage()` auth guard with sequential gating
- [x] FlowShell Context pattern (Server→Client callback bridge)
- [x] Grain texture overlay (CSS `body::before`)
- [x] Smooth scroll, custom scrollbar, Georgia serif base
- [x] Stage navigation dots (fixed left edge, hover labels)

### Identity
- [x] 20-question identity flow (enum/text/tags input types)
- [x] Orientation screen before Q1 ("Twenty questions...")
- [x] Progress bar (grows with each step)
- [x] Stage watermark in top-right corner
- [x] Upsert to `career_identity` table on completion

### Credentials
- [x] PDF/text resume upload (pdfjs-dist dynamic import)
- [x] GitHub URL field
- [x] Project descriptions list
- [x] Upsert to `credentials` table on save
- [x] `resumes` storage bucket upload (best-effort)

### Career Paths
- [x] `buildCareerContext()` aggregator (identity + credentials + complete capsules)
- [x] `generateCareerPaths()` AI engine (claude-opus-4-6, 4096 tokens)
- [x] Snapshot caching — reuses existing snapshot on refresh (no API waste)
- [x] Scroll-driven narrative visualization:
  - Section 1: Intro (alignment pills, path count title, scroll line)
  - Section 2: SVG bezier divergence (animates on scroll, sticky 220vh)
  - Section 3: Per-path chapters (IntersectionObserver reveals, two-column)
  - Section 4: Observations + missing context (left-border styling)
- [x] Path response buttons (pursuing/considering/deferring/not this) per path
- [x] "continue →" overlay (appears after 8s)

### Dashboard
- [x] 7-block grid (Identity/Credentials/Paths/Mentor/Reflection/Interview/Check-in)
- [x] Completion status indicators per block
- [x] "continue →" to next incomplete stage
- [x] Active pursuits section (paths marked as pursuing)
- [x] Behavioral patterns section (from loadMemory — detected patterns from behavior_log)

### Mentor
- [x] Streaming AI chat (reads full buffer, then reveals paragraphs)
- [x] Collapsible sidebar showing career paths
- [x] Left-border rule styling on AI responses
- [x] "reflection →" forward nav after first exchange
- [x] Stage watermark

### Skills
- [x] `/skills` route — 3D Skill Constellation
- [x] `buildSkillNodes()` derives nodes from identity + path gaps
- [x] Owned / exploring / gap encoding (size=leverage, opacity=relevance, color=status)
- [x] Hover edges + label sharpening
- [x] Legend overlay

### Proof Capsules
- [x] 6-section editor (claim/context/constraints/reasoning/iterations/reflection)
- [x] Section dot navigation + keyboard shortcuts
- [x] 1500ms debounce autosave + revision history
- [x] Completeness ring per capsule in list
- [x] First-visit explanation (what a proof capsule is)
- [x] View mode with full display + edit link

### Interview Prep
- [x] `/interview` route
- [x] STAR story generator (maps proof capsules to STAR format)
- [x] Role fit analyzer (paste job description, AI compares to profile)
- [x] Tab UI: STAR Stories | Role Fit

### Check-in
- [x] `/check-in` route — 3-question weekly reflection
- [x] AI processes answers (processCheckIn in lib/ai/checkin.ts)
- [x] Returns brief reflection + sharpening question for next week
- [x] submitCheckIn server action in app/actions/checkin.ts

### UI/Polish
- [x] Fraunces display serif font (headings)
- [x] DM Mono for data labels
- [x] Copper accent color (#7a5c38) for primary CTAs
- [x] Muted green (#4a6258) for completion states
- [x] Mouse parallax on entry canvas
- [x] Cmd+K command palette (quick navigation)
- [x] Back-to-dashboard from all stage pages
- [x] Page fade-in transitions (PageReveal wrapper)

---

## Planned / In Progress

### Currently building (Phase 3+)
- [x] Anti-Recommendation System — new `anti_recommendations` field in AI output, `AntiRecommendationSection` in CareerPathViz, rust-dim visual treatment
- [x] Career Mode Switching (Explore / Build / Recover / Reflect) — `types/mode.ts`, `ModeSelector` component, mode injected into mentor system prompt via `buildSystemPrompt`, shown on dashboard + mentor header
- [ ] Decision Memory (mentor references past choices: "last time you ignored this...")
- [ ] Regret Simulation modal (before committing to a path, AI simulates you 18 months later)
- [ ] Skills constellation upgrades: skill decay (flickering nodes), leverage scores, dependency lines
- [x] Daily execution card on dashboard — `lib/ai/daily.ts`, `app/actions/daily.ts`, `DailyCard` client component (lazy-loaded, mode-aware, green accent)
- [x] Friction detection — `friction_detected` pattern in `detectPatterns()` flags paths deferred 3+ times
- [x] Career Story Generator — `lib/ai/story.ts`, `app/actions/story.ts`, `/story` page (first-person Fraunces italic narrative, copy button, regenerate)
- [x] Offer Evaluator — `lib/ai/offer.ts`, `app/actions/offer.ts`, `/offer` page (verdict: take/negotiate/decline/unclear, what fits/conflicts/red flags/negotiation points)
- [x] Failure Archive — `/failures` page, localStorage-based, 3-field entry (what happened/cost/taught), expandable list with delete
- [x] Decision Memory — mentor prompt upgraded: explicit instruction to cite path names + dates, memory serializer now includes `(committed/dismissed/deferred on YYYY-MM-DD)` for all responses
- [x] Regret Simulation modal — `lib/ai/regret.ts`, `app/actions/regret.ts`, `RegretModal.tsx` — intercepts "pursuing" click, shows 18-month first-person simulation + honest question before confirming
- [x] Skills constellation upgrades: skill decay flickering (dual-frequency sin wave for relevance < 0.38 gap/exploring nodes), leverage score bar in hover panel
- [x] LinkedIn Data Import — `lib/linkedin/parser.ts` (client-side ZIP parser), `lib/db/linkedin.ts`, `app/actions/linkedin.ts`, `app/linkedin/page.tsx`, `components/linkedin/LinkedInImport.tsx` — upload LinkedIn export ZIP, parse positions/skills/education/posts locally, save to `linkedin_data` table
- [x] LinkedIn Posts Archive — `app/linkedin/posts/page.tsx`, `components/linkedin/PostsArchive.tsx`, `lib/ai/linkedin.ts`, `app/actions/linkedin-insights.ts` — searchable post timeline with AI insight analysis (themes, expertise signals, communication style)
- [x] LinkedIn → CareerContext — `lib/ai/context.ts` now fetches `linkedin_data` and includes work history + posts in every AI call (paths, mentor, offer evaluator)
- [x] LinkedIn → nav — StageNav, TopNav mobile menu, CommandPalette all include LinkedIn import link
- [x] Dashboard LinkedIn status — shows import status (post count, position count) in right orbit; links to posts archive
- [ ] Reality Layer / Market Signals (job posting trends, skill demand velocity)
- [ ] Proof Evolution (re-evaluate capsules with new lens, growth delta)

### Next up
- [ ] Mobile layout fixes (StageNav → bottom bar on mobile, paths stack vertically)
- [ ] Path evolution — "context changed since this was generated · regenerate" prompt
- [ ] LinkedIn About section import in credentials
- [ ] Learning plan per gap (expandable in path detail sections)
- [ ] Bloom postprocessing on SkillConstellation owned nodes
- [ ] Mouse parallax depth on paths SVG section
- [ ] Offer/decision framework (evaluate an offer against paths + values)

### Stretch
- [ ] `/roles` — saved job descriptions with fit scores
- [ ] Resume tailoring from proof capsules
- [ ] Question pressure tester (interview mode toggle in mentor)
- [ ] Behavioral timeline view (visual history from behavior_log)

---

## Known Issues / Fixes Applied

| Issue | Fix |
|-------|-----|
| `current_role` reserved word in Postgres | Quoted as `"current_role"` in migration |
| R3F incompatible with React 19 (ReactCurrentOwner) | Upgraded to @react-three/fiber v9 + @react-three/drei v10 |
| FlowShell render-prop crossed Server/Client boundary | Changed to Context provider pattern with Connected wrappers |
| AI response truncated at 2048 tokens | Increased max_tokens to 4096 |
| AI response JSON wrapped in code fences | Parser now uses regex + first{/last} fallback |
| pdfjs-dist missing canvas alias | `config.resolve.alias.canvas = false` in next.config.ts |
| API called on every page refresh (expensive) | Snapshot caching — `getLatestSnapshot()` checked first |

---

## Session Recovery

If this session ends, use this file to brief a new Claude session:
1. Share this file as context
2. Say which section of "Planned / In Progress" to work on next
3. All architecture decisions are documented above — no need to re-derive them
