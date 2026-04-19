# Pathon — Hawkathon 2026 Presentation Guide

> Two formats: **7-minute judges-only round** and **5-minute finals on stage**.
> This doc covers the full demo script, what to click, what to say, and how to handle questions.

---

## The One-Line Pitch

> **"Pathon is the AI intelligence layer that sits between every job seeker and every hiring team — and it actually works for both sides."**

---

## 1. The Problem (say this before touching the screen)

**Say out loud:**

> "Every year, millions of people apply for jobs they're almost qualified for. They don't know exactly what's missing. They don't know what the market pays. They spend hours writing cover letters that get auto-rejected in 3 seconds by a parser they never saw.
>
> On the other side, hiring managers read 200 resumes, shortlist 5, interview 3, and still make the wrong call.
>
> The tools built to solve this are either generic AI chatbots with no context about who you are — or expensive recruiter software that small teams can't afford.
>
> We built Pathon. It's not a chatbot. It's not a job board. It's a full intelligence system that understands both sides of the same hire."

---

## 2. The Landing Page (30 seconds)

**Navigate to:** `localhost:3000` (or deployed URL)

**What to show:**
- The hero with the **mode switcher** — click "For Job Seekers" then "For Employers"
- Watch the headline change, the accent color shift copper → indigo
- Scroll slowly past the stats bar
- Point at the **features grid** — 8 applicant tools, 5 employer tools
- The **How it Works** panels with live data previews
- The FAQ section — open 1-2 questions

**Say:**
> "Before a single click — notice this isn't one dashboard. It's two products sharing the same account. Job seekers and employers both sign in with a magic link — no passwords, no friction. The system routes them to the right experience automatically."

**Show the auth form:**
- Type a real email
- Hit "Get started free →"
- Show the "Magic link sent!" state with the email shown

---

## 3. Applicant Dashboard — Full Demo

### 3a. Sign In + Onboarding (skip if already logged in)

**Navigate to:** `/onboarding`

Show the **role selector** — two 3D tilt cards ("Job Seeker" vs "Hiring"). Select Job Seeker.

> "First time in — you pick your role. One click. The system remembers."

---

### 3b. Dashboard (`/dashboard`)

**Navigate to:** `/dashboard`

**What to point out:**
- The **Next Best Action** card (top, glowing copper border) — this is the AI-powered decision engine that tells you exactly what to do next based on your current profile state
- **3 Metric cards** — Applications, Network size, Warm intro paths
- **6 Tool tiles** — 3D tilt on hover, each links to a real tool
- The **LinkedIn import prompt** at the bottom

**Say:**
> "This isn't a dashboard that shows you your progress. It's a command center that tells you what move to make next. Every card, every number, every action is driven by what we know about you — not generic advice."

---

### 3c. Identity Flow (`/identity`)

**Navigate to:** `/identity`

> "Before any AI tool can help you, it needs to know who you are — not just your skills, but how you think."

Walk through the identity questions briefly — career stage, thinking style, decision approach.

> "We map your cognitive profile. This feeds into every tool downstream — the mentor, the gap analyzer, the cover letter. Nothing is generic."

---

### 3d. Credentials + LinkedIn Import (`/credentials` → `/linkedin`)

**Navigate to:** `/credentials`

> "Upload your resume, link your GitHub, describe your projects. Then:"

**Navigate to:** `/linkedin`

> "Import your LinkedIn data — positions, skills, posts. One paste. This unlocks the network map and makes every AI tool context-aware."

---

### 3e. AI Mentor (`/mentor`)

**Navigate to:** `/mentor`

> "This isn't a chatbot. It's a shadow mentor that knows your career identity, your thinking style, and your proof capsules. It challenges your reasoning — not just your resume."

Type a real question live: *"Should I take a PM role or stay technical?"*

> "It knows your cognitive profile. It gives you the uncomfortable honest answer. The mentor gets smarter every session — it builds a memory of your decisions and patterns over time."

---

### 3f. THE BIG DEMO — Gap Analyzer (`/gap-analyzer`) ⭐

**This is your centerpiece. Give it the most time.**

**Navigate to:** `/gap-analyzer`

**Read the page header:** *"Know exactly what's missing."*

**Set up the demo:**
1. Type in Target Role: `Staff ML Engineer`
2. Type Target Company: `OpenAI` (optional but impressive)
3. Select time budget: `1 Week`
4. Select situation chips: `Currently employed`, `Part-time learner`
5. Hit **"Run gap analysis →"**

**While it loads — narrate what's happening:**
> "Watch the three-phase pipeline fire in real time. First — the Market Oracle. It's pulling 2026 salary ranges and demand signals for Staff ML Engineer roles right now. Second — the Gap Planner agent maps your specific skill gaps against your profile and what the market actually requires. Third — the Syllabus Builder finds real verified courses from Coursera, YouTube, fast.ai, and builds you a day-by-day schedule."

**When the oracle panel appears on the right:**
> "Salary range — live. Market demand — live. The five skills employers are actively hiring for right now."

**When results appear:**
- Show the **readiness score circle** animating up
- Show the **Critical Gaps** section — expand one gap, read the "How to Close" text
- Show the **Moderate Gaps**
- Click the **"48-Hour Syllabus" tab**
- Wait for the spinner to resolve (or narrate while it loads)
- Open **Day 1** — show the blocks, the resource pills
- Click a **Coursera or YouTube link** to show it's a real verified URL, not hallucinated

**Say:**
> "This is a real Coursera specialization. Real YouTube playlist. Not a search redirect. Not hallucinated. Our resource library has 50+ curated links baked in — the AI is told to use exact URLs, not make them up. When you're done with today's session, hit Export MD and you have your entire learning schedule in your notes."

---

### 3g. ATS Scanner (`/ats`)

**Navigate to:** `/ats`

Paste a real job description. Paste or show a resume.

> "Most people have no idea their resume gets auto-rejected in 3 seconds by a parser. Our ATS Scanner scores your resume against the job description and tells you exactly what keywords are missing, what sections are weak, and what the recruiter actually sees."

Show the score and breakdown.

---

### 3h. Mock Interview (`/mock-interview`)

**Navigate to:** `/mock-interview`

> "This is real-time voice. You speak — the AI interviewer responds with spoken audio. Behavioral, technical, or case. You pick the pressure level."

Start a session if time allows. Even 30 seconds of the voice back-and-forth is impressive.

> "At the end of every session, you get detailed written feedback on your answers, your filler words, and your structure."

---

### 3i. Cover Letter AI (`/cover-letter`)

**Navigate to:** `/cover-letter`

> "Paste any job description. The AI writes a cover letter that uses your actual career data — your proof capsules, your career identity, your LinkedIn positions. Not a template. It knows you."

Generate one live if time permits.

---

### 3j. Salary & Negotiation (`/salary`)

**Navigate to:** `/salary`

> "Enter your target role. Get a personalized salary band based on your profile and live market data. Then — practice the negotiation with an AI that pushes back like a real hiring manager would."

> "Most people undersell by $15–30k in salary negotiation because they never practice. We fix that."

---

### 3k. Application Tracker (`/tracker`)

**Navigate to:** `/tracker`

> "Every application, every status, every follow-up date — Kanban-style. One place. No spreadsheet. The dashboard shows you active vs. pipeline vs. offers in real time."

---

### 3l. Network Map (`/network`)

**Navigate to:** `/network`

> "After you import LinkedIn, the network map finds warm intro paths to companies you're targeting. Know who can open the door before you even apply."

---

## 4. Employer Dashboard — Full Demo

### 4a. Employer Entry

> "Same magic link. During onboarding you select 'Hiring' instead of 'Job Seeker'. You go straight here."

**Navigate to:** `/employer/dashboard`

**Point out:**
- The **Command Center** headline with indigo accent
- Stat cards: Total Candidates, Active Jobs, New This Week, Hires
- **Pipeline bar** by stage — Applied → Reviewed → Phone Screen → Interview → Hired
- **Recent Job Postings** list — click one

---

### 4b. Job Builder (`/employer/jobs/new`)

**Navigate to:** `/employer/jobs/new`

> "Describe the role in plain English. Hit generate."

Type: *"We need a senior backend engineer who can own our payments infrastructure, mentor junior devs, and work closely with product."*

Hit generate.

> "The AI writes a structured, bias-checked, market-calibrated job description. Sections, requirements, nice-to-haves — all there. Edit anything, then post it."

---

### 4c. Pipeline (`/employer/pipeline`)

**Navigate to:** `/employer/pipeline`

> "Every applicant auto-scored against your rubric. Move candidates through stages with drag-and-drop. No resume pile. The AI reads 200 applications and surfaces the best ones."

Show the Kanban board with candidate cards.

---

### 4d. Talent Pool (`/employer/talent`)

**Navigate to:** `/employer/talent`

> "Cross-role talent pool. See candidates who applied to multiple roles. Filter by score, skill, location. Build a pipeline before you even open a req."

---

### 4e. Company Profile (`/employer/company`)

**Navigate to:** `/employer/company`

> "Build a company page that sells the role before a recruiter ever calls. Culture, team size, mission. Job seekers on the Pathon side see this alongside every posting."

---

## 5. The Architecture (say this for technical judges, 60 seconds)

> "Under the hood: Next.js 15 App Router with full TypeScript. Supabase for auth, real-time database, and file storage. The AI layer is Claude — specifically claude-haiku-4-5 for speed across the pipeline.

> The Gap Analyzer runs a 3-phase streaming pipeline over Server-Sent Events:
> - Phase 1: Market Oracle — haiku model, 6-second hard timeout, parallel with career context build
> - Phase 2: Gap Planner — haiku, 900 token cap, context pre-truncated to 600 chars for speed
> - Phase 3: Syllabus Builder — haiku with a 50+ curated resource library injected into the prompt so URLs are real, not hallucinated. Hard fallback that generates a plan without AI if the model fails.

> Total pipeline time: 8–15 seconds. No mocks, no fixtures — all live.

> The whole thing is deployed and production-ready. Magic link auth, no passwords, PKCE flow, callback routes, employer vs. applicant routing all handled."

---

## 6. The Close — What Makes This Different

**Say:**
> "Every tool we showed you is connected. The gap analyzer knows your LinkedIn import. The cover letter knows your proof capsules. The mentor knows your thinking style. The employer side knows the same market data the applicant side uses.

> This isn't 13 random AI tools bolted together. It's one system that reasons about your career over time — on both sides of every hire.

> We built this in 48 hours. It's live. It works. And we think it's the most complete career intelligence system at this hackathon."

**Pause. Let it land.**

---

## 7. Q&A Prep — Likely Judge Questions

| Question | Answer |
|---|---|
| **How is this different from LinkedIn?** | LinkedIn shows you what jobs exist. Pathon tells you if you're actually ready for them, closes the gaps, and prepares you for the interview. LinkedIn has no employer + applicant intelligence loop. |
| **How is this different from ChatGPT?** | ChatGPT knows nothing about you. Pathon builds a persistent career profile — identity, credentials, LinkedIn, proof capsules — and every tool uses it. It gets smarter the more you use it. |
| **Are the URLs in the syllabus real?** | Yes. We built a 50+ resource library with direct verified links — real Coursera specialization slugs, real YouTube playlist IDs, real cert pages. The AI is instructed to use only those exact URLs. |
| **What's the business model?** | Freemium. Core tools free forever. Employer side on a per-seat SaaS model. Job seeker premium for advanced features like full history and team coaching. |
| **Can it scale?** | The AI layer is stateless — haiku runs per-request. Supabase handles auth and data. Vercel handles deployment. We'd add Redis for caching and a job queue for async pipelines at scale. |
| **Is the employer and applicant data shared?** | No. Applicant data is never shared with employers without explicit action. The two sides share market intelligence (salary ranges, demand data) but not personal profiles. |
| **Why haiku instead of a bigger model?** | Speed. In a live demo and real product, waiting 60 seconds for a gap analysis kills the experience. Haiku + smart prompts + context truncation gets us 8-15 seconds. We use sonnet only where quality matters most. |
| **How did you build this in 48 hours?** | We designed the data model first, built auth and routing, then layered in AI features top-to-bottom. Every AI call has a hard fallback — if the model fails, the product still works. |

---

## 8. Demo Order by Format

### 7-Minute Judges Demo (technical depth)
```
0:00 – 0:45   Problem statement (spoken, no screen)
0:45 – 1:15   Landing page — mode switcher, auth form, both sides
1:15 – 1:40   Dashboard — NBA card, metric tiles, quick launch
1:40 – 1:55   AI Mentor — ask a hard question, show the response
1:55 – 4:00   Gap Analyzer — FULL DEMO (the centerpiece)
              Oracle → Planner → Syllabus → real resource links
4:00 – 4:25   ATS Scanner — paste JD, show score
4:25 – 4:50   Mock Interview — start session, 30 seconds of voice
4:50 – 5:20   Employer — Command Center, Job Builder generate live
5:20 – 5:50   Employer — Pipeline (Kanban), Talent Pool
5:50 – 6:20   Architecture callout (SSE, haiku, resource library)
6:20 – 7:00   The close — one system, both sides, live
```

### 5-Minute Finals (audience energy, fast pace)
```
0:00 – 0:30   Hook: "Most people are rejected by a machine they never see."
0:30 – 1:00   Landing page — show both modes, type email, send magic link
1:00 – 2:30   Gap Analyzer — run it LIVE, narrate the pipeline, show syllabus
2:30 – 3:00   Mock Interview — 30 seconds of real voice interaction
3:00 – 3:30   Employer side — Job Builder generate live, Pipeline Kanban
3:30 – 4:00   Show the intelligence loop: same market data, both sides
4:00 – 4:30   Close: "13 tools, one system, built in 48 hours. It's live right now."
4:30 – 5:00   Questions / applause
```

---

## 9. Live Demo Checklist (do before presentation)

- [ ] Log into the applicant account that has a filled profile (identity + LinkedIn imported)
- [ ] Have a target role typed and ready: `Staff ML Engineer at OpenAI`
- [ ] Keep browser zoom at ~90% so more fits on screen
- [ ] Run the gap analyzer ONCE before the demo to confirm it works
- [ ] Keep the employer account logged in on a second browser tab
- [ ] Test the mock interview mic permissions
- [ ] Have a real job description copied for the ATS scanner demo
- [ ] Dark mode is on (it's the default)
- [ ] Kill all browser notifications
- [ ] Run `npm run build` before the demo — use the production build, not dev

---

## 10. One-Slide Summary (if you need to make a slide)

```
PATHON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The AI intelligence layer for both sides of every hire.

JOB SEEKER SIDE                    EMPLOYER SIDE
─────────────────                  ─────────────
◆ AI Career Mentor                 ◐ AI Job Builder
⊕ Gap Analyzer (3-agent AI)        ◑ Auto Resume Scoring
⊕ 48-Hour Learning Syllabus        ◒ Candidate Pipeline
◈ ATS Resume Scanner               ◓ Interview Kit
◷ AI Mock Interview (voice)        ◔ Company Profile
◎ Salary + Negotiation Practice
⌁ Network Warm Paths
◷ Cover Letter Generator
⊟ Application Tracker

TECH STACK: Next.js 15 · Supabase · Claude (haiku) · SSE Streaming
BUILT IN: 48 hours · LIVE at: [your URL]

"13 tools. One system. Both sides of the hire."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 11. Energy Notes

- **Don't read** — know the product cold, talk to the judges not the screen
- **Slow down** on the Gap Analyzer — that's your tech showcase moment
- **The voice mock interview** will get a reaction from the audience — lean into it
- **When the syllabus loads** with real Coursera/YouTube links — scroll slowly, let judges read them
- **If something breaks** — say "That's the live AI pipeline, give it a second" and keep talking. Never apologize.
- **The mode switcher** on the landing page — do it slowly and let the color animation land. It's a subtle wow moment.
- **For finals** — start with the voice mock interview clip or the gap analyzer running live. Don't save the best for last. Open with it.

---

*Built for Hawkathon 2026 · Pathon — Career Intelligence Platform*
