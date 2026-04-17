# Pathon

**A career operating system that helps applicants understand why they're losing — and what to do next.**

---

## The Problem

Most job seekers are flying blind.

- **They apply and hear nothing.** No feedback, no signal — just silence. Ghost rates are at an all-time high.
- **ATS filters reject qualified people before a human ever sees their resume.** Most candidates don't know which keywords they're missing.
- **Career tools are siloed.** Resume builders don't talk to interview prep. Job trackers don't connect to salary data. You switch between 8 tabs to do what one system should handle.
- **AI career tools give generic advice.** They don't know your actual history, your thinking style, or what roles you've already applied to. They treat every user the same.
- **No one practices negotiation.** Candidates accept the first offer because they've never rehearsed pushing back.

---

## The Solution

Pathon is a unified career intelligence layer. It ingests your actual data — resume, LinkedIn history, job applications — and uses that context to give you specific, actionable guidance at every stage of the job search.

### What it does

| Feature | What it solves |
|---|---|
| **ATS Scanner** | Scores your resume against any job description. Shows every missing keyword, phrase, and formatting issue — ranked by impact. |
| **Cover Letter Generator** | Writes a letter from your actual resume and career data. Not a template. Not a generic AI response. |
| **Mock Interview** | Streaming AI interviewer across 4 types: behavioral, technical, system design, product sense. Scored at the end. |
| **Gap Analyzer** | Compares your profile to a target role. Returns a readiness score (0–100) and a prioritized list of skills to close. |
| **Salary & Negotiation** | Estimates your market range based on role, location, and experience. Then lets you practice the negotiation conversation with an AI hiring manager before the real call. |
| **Application Tracker** | Kanban board with automatic ghost detection. Flags applications that have gone cold based on time-since-contact heuristics. |
| **Network Map** | Import your LinkedIn Connections.csv, see your network by company, and get AI-written warm outreach messages for the contacts most likely to get you in. |
| **AI Mentor** | A shadow mentor that challenges your reasoning — not a chatbot that validates everything you say. |
| **Career Identity** | Structured onboarding that captures how you think, what you optimize for, and where you're headed. Every AI feature uses this as context. |

### What makes it different

- Every AI feature is context-aware — it knows your resume, your career stage, your past applications
- All tools are connected. Your gap analysis informs your interview prep. Your tracker feeds your dashboard.
- Designed to feel like a tool you'd actually pay for — not a hackathon prototype

---

## Demo

> **Live demo:** coming soon

### Key screens

**Landing page** — animated particle constellation, text-scramble headline, magnetic CTA

**Dashboard** — bento-grid mission control. Next best action card, metric tiles, tool launcher.

**ATS Scanner** — SVG arc score reveal, particle burst on high scores, keyword chip grid with missing skills

**Mock Interview** — premium call UI with real-time streaming, waveform indicator, AI feedback at session end

**Gap Analyzer** — animated readiness ring, skill gap cards sorted by severity, weekly closure plan

**Salary** — gradient market range bar, live negotiation chat with AI hiring manager

**Tracker** — glass-morphism Kanban with ghost detection badges and count-up stat orbs

---

## Tech Stack

| Layer | Tools |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Inline styles + CSS custom properties (no Tailwind on components) |
| **Animation** | Framer Motion, Three.js, GSAP, Lenis (smooth scroll) |
| **AI** | Anthropic Claude (`claude-opus-4-6`) + Copilot + Codeex |
| **Auth** | Supabase Auth (magic link) |
| **Database** | Supabase Postgres with Row Level Security |
| **File parsing** | pdfjs-dist (resume), jszip (LinkedIn export) |
| **Deployment** | Vercel |

### Architecture notes

- All AI routes are streaming — `ReadableStream` + server-sent events for real-time output
- Per-user context is passed into every AI prompt: career stage, thinking style, resume text, active applications
- ATS and cover letter results are cached by content hash to avoid redundant API calls
- RLS policies ensure users can only access their own data

---

## Running Locally

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- An Anthropic API key

### Steps

```bash
# 1. Clone
git clone https://github.com/a1nmol/Pathon
cd Pathon

# 2. Install
npm install

# 3. Environment variables
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Run migrations

In the Supabase SQL Editor, run the files in `supabase/migrations/` in order:

```
20260408000000_career_identity.sql
20260408000001_credentials.sql
20260408000002_career_state_memory.sql
20260408000003_proof_capsules.sql
20260416000004_linkedin_data.sql
20260416000005_application_tracker.sql
20260416000006_ats_cover.sql
20260416000007_mock_interview.sql
20260416000008_gap_salary_network.sql
20260417000009_fix_schemas.sql
```

```bash
# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with any email (magic link via Supabase).

---

## Project Status

Built in ~48 hours as a hackathon submission.

**What's working end-to-end:**
- Auth (magic link)
- Career identity onboarding
- ATS Scanner with caching
- Cover Letter generator
- Mock Interview (4 types, streaming, scored)
- Gap Analyzer with readiness score
- Salary range + negotiation practice
- Application Tracker with ghost detection
- Network Map with warm path AI
- LinkedIn data import
- Dashboard with next-best-action engine

**What's next:**
- Resume parsing improvements (better section extraction)
- Email reminders for ghosted applications
- Interview recording + transcript analysis
- Company-specific interview intelligence
- Mobile app (React Native)

---

## Team

Built by **Anmol Subedi** , **Samayara Rijal**, **Praful Shrestha** for Hawkathon 2026.

---

## License

MIT
