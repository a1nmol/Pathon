# Pathon — DevPost Submission

## One-Line Pitch

> **Pathon is the AI intelligence layer that sits between every job seeker and every hiring team — a full two-sided platform that understands both sides of the same hire.**

---

## Inspiration

Every year, millions of people apply for jobs they're *almost* qualified for. They don't know exactly what's missing. They don't know what the market pays. They spend hours writing cover letters that get auto-rejected in 3 seconds by a parser they never saw.

On the other side, hiring managers read 200 resumes, shortlist 5, interview 3, and still make the wrong call.

The tools built to solve this are either generic AI chatbots with no real context about who you are — or expensive enterprise recruiter software that small teams can't afford.

**We built Pathon.** It's not a chatbot. It's not a job board. It's a full intelligence system that understands both sides of the same hire — built entirely in one 48-hour hackathon.

---

## What It Does

Pathon is a **two-sided career intelligence platform** — one login, two completely separate product experiences that share the same AI backbone.

### For Job Seekers

**Career Identity Engine**
A 20-question deep-profile flow that builds a cognitive + career model of who you are — your thinking style, risk tolerance, what you're optimizing for, and where you're stuck. This profile powers every AI feature downstream.

**AI Career Path Generator**
Claude analyses your full identity, resume, LinkedIn history, and proof capsules to generate 2-3 personalized career paths with alignment scores, time-to-readiness estimates, missing skills, and anti-recommendations (paths that look good but aren't right for you). Rendered as a cinematic scroll-driven narrative — not a list.

**Next Best Action (NBA) System**
The dashboard doesn't show you a progress bar. It shows you exactly one thing: what to do next. An AI decision engine runs on every page load, reads your current state, and recommends the single highest-leverage action available to you right now.

**ATS Scanner**
Paste a job description — Pathon compares it to your actual resume, scores it 0–100, identifies every keyword gap, missing hard/soft skill, and gives you specific fixes. Exportable as a PDF report.

**Cover Letter Generator**
Not a template. Not a ChatGPT prompt. The cover letter is built from your proof capsules, LinkedIn voice, career identity, and the specific job description. Renders in a full two-column document layout with PDF export.

**Proof Capsules (Decision Records)**
A structured 6-section editor (claim → context → constraints → reasoning → iterations → reflection) for documenting real decisions and projects. These capsules feed into STAR story generation for interviews, role fit analysis, and career path matching.

**3D Skill Constellation**
A live Three.js visualization of your skill graph — owned skills (bright), exploring (dim), gaps from your target paths (flickering decay animation). Nodes sized by leverage, colored by status.

**Mock Interview Prep**
AI generates STAR-formatted interview stories directly from your proof capsules. Paste a job description and get a role-fit analysis against your full profile.

**LinkedIn Intelligence**
Upload your LinkedIn data export ZIP — parsed entirely client-side (no server upload of personal data). Imports your full work history, skills, posts, and education. AI extracts expertise signals, communication style, and themes from your post history.

**Gap Analyzer**
A multi-agent system that identifies skill gaps between your current profile and target roles, then generates a prioritized learning plan with resource recommendations.

**Salary Intelligence**
AI-powered salary research and negotiation strategy based on your profile, target role, and market signals.

**Job Application Tracker**
A Kanban board for tracking every application — with status columns, notes, and AI-suggested next actions per role.

**Failure Archive**
A private, localStorage-only space to log professional failures — what happened, what it cost, what you learned. Never sent to any server.

**Career Story Generator**
First-person narrative essay (350–500 words) written in your voice, from your proof capsules and work history. Copy-paste into any "tell me about yourself" prompt.

**Offer Evaluator**
Paste any job offer — AI compares it to your career paths, values, and identity profile. Returns: take / negotiate / decline / unclear, with specific red flags and negotiation points.

**AI Shadow Mentor**
A streaming chat interface with an AI mentor that has full context of your career history, active paths, proof capsules, and LinkedIn data. Cites your past decisions by date. Runs two parallel AI personas in a debate format for career dilemmas.

**Weekly Check-In**
3 questions, once a week. AI processes your answers, returns a brief reflection and one sharpening question for next week. Stored in behavior memory and fed back into future recommendations.

---

### For Employers (Hiring Mode)

Switch from job seeker to hiring with one click — same account, completely separate AI-powered experience.

**AI Job Description Generator**
Describe a role in plain language. AI generates a complete, structured job description with responsibilities, requirements, compensation context, and culture framing. Full rich-text editor with real-time preview.

**Candidate Pipeline (Kanban)**
Full drag-and-drop hiring pipeline: Applied → Screening → Interview → Offer → Hired. Add notes, track candidates across stages.

**Talent Pool**
Browse and search all candidates who have expressed interest, with profile snapshots and skill matching.

**Analytics Dashboard**
Hiring funnel metrics — applications by stage, conversion rates, time-in-stage, weekly new candidates.

**Job Export**
Export any job description as a formatted PDF or Word (.doc) document — no third-party dependencies.

**Company Profile**
Inline slide-out panel on the dashboard for setting company details, tech stack, and culture tags — used to personalise the AI job description generator.

---

## How We Built It

Pathon was built from scratch in ~48 hours using a server-first architecture with AI at the core of every feature.

**The AI layer** is not a wrapper around a chatbot. Every AI module receives a `CareerContext` object — a single normalised data structure built from the user's identity, credentials, LinkedIn data, proof capsules, and behavior memory. This context is assembled once and passed to every Claude call, ensuring all AI features are coherent with each other.

**The database** is event-sourced and append-only for user memory — no destructive updates. Behavior logs, proof revisions, and path snapshots accumulate over time and are used to detect patterns, friction points, and decision history.

**The frontend** is built with a "cinematic" design philosophy — everything has motion, every transition is intentional, and the UI itself communicates state through animation rather than just text labels.

---

## Tech Stack

### Languages & Frameworks
- **TypeScript** — full-stack type safety
- **Next.js 15** (App Router) — server components for data, client components for interactivity
- **React 19** — latest concurrent features

### AI & Intelligence
- **Anthropic Claude API** (`claude-opus-4-6`) — powers all AI features: career paths, mentor, ATS, cover letters, gap analysis, salary, offer evaluation, STAR stories, LinkedIn insights, daily actions, check-ins, debate, story generation, regret simulation
- **Streaming responses** — mentor chat streams token-by-token for real-time feel
- **Multi-agent architecture** — gap analyzer uses sequential agent pattern with planning, research, and synthesis steps

### Database & Auth
- **Supabase** (PostgreSQL) — 15+ tables, Row Level Security on all tables
- **Supabase Auth** — magic link (PKCE flow) + Google OAuth + GitHub OAuth
- **`@supabase/ssr`** — server-side auth with cookie management

### 3D & Animation
- **Three.js** + **@react-three/fiber** + **@react-three/drei** — 3D skill constellation, icosahedron wireframe on landing page
- **Framer Motion** — every UI transition, drag-and-drop, page reveals, AnimatePresence
- **GSAP** — supplementary scroll animations

### Frontend
- **Tailwind CSS** — utility base
- **CSS custom properties** — full dark/light theme system with 30+ design tokens
- **`pdfjs-dist`** — client-side PDF parsing for resume upload (no server upload)
- **JSZip** — client-side LinkedIn export ZIP parsing (privacy-first: data never leaves the browser before parsing)

### Fonts
- **Poppins** — display headings
- **Inter** — body and UI text
- **DM Mono** — data labels, monospace accents

### Export
- **Browser Print API** — PDF export (cover letter, ATS report, job descriptions) with zero npm dependencies
- **HTML Blob + MSWord MIME type** — Word (.doc) export for job descriptions

### Infrastructure
- **Vercel** — edge deployment, automatic preview deployments per git push
- **GitHub** — version control

---

## Challenges We Ran Into

**React 19 + Three.js compatibility** — @react-three/fiber hadn't fully updated for React 19's `ReactCurrentOwner` API changes. Had to upgrade to fiber v9 and drei v10 and wrap 3D components carefully to avoid SSR crashes.

**PDF parsing without a server** — We wanted resume upload to be privacy-first (never send a raw PDF to a server). Used `pdfjs-dist` entirely client-side with a dynamic import and a webpack alias (`canvas = false`) to prevent SSR failures.

**LinkedIn data privacy** — LinkedIn export ZIPs contain deeply personal data. We parse the entire ZIP in the browser using JSZip before any data touches our servers — users see their parsed data before it's ever stored.

**AI context coherence** — With 15+ different AI features, keeping them all coherent required building a single `CareerContext` object as the single source of truth. This context is rebuilt on every AI call, assembled from live DB data, ensuring every Claude call has identical context.

**Two-sided architecture** — Building two complete product experiences (applicant + employer) in 48 hours that share auth, database, and AI infrastructure without bleeding state between them required careful middleware routing and role-gated layouts.

---

## Accomplishments We're Proud Of

- **15+ production-quality AI features** built and working in a single hackathon window — not mocks, not demos, real functionality
- **Zero password auth** — magic links and OAuth only, with server-validated session management
- **Privacy-first data handling** — LinkedIn and resume data parsed entirely in the browser before any server upload
- **True two-sided platform** — not a job board with a "recruiter view" bolted on. Two complete product experiences sharing one intelligent backbone
- **Cinematic UI** that feels like a product company shipped it — 3D skill constellation, scroll-driven career path narratives, magnetic buttons, framer motion on every interaction
- **Append-only memory system** — user behavior, decisions, and reflections accumulate over time and feed back into increasingly personalised AI recommendations

---

## What's Next

- **Real-time market signals** — integrate job posting APIs to show live skill demand velocity and salary benchmarks
- **Resume tailoring** — auto-generate a tailored resume from proof capsules for any specific job description
- **Proof evolution** — re-evaluate past decision capsules through new career lenses as paths change
- **Skills decay modeling** — time-weighted relevance scores on skills based on industry velocity
- **Interview simulation** — live back-and-forth AI interview practice with pressure modes and feedback

---

## Built With (DevPost Tags)

`Next.js` `React` `TypeScript` `Supabase` `PostgreSQL` `Anthropic Claude` `Claude API` `Three.js` `React Three Fiber` `Framer Motion` `Tailwind CSS` `Vercel` `Node.js` `JavaScript` `HTML5` `CSS3` `pdfjs-dist` `JSZip` `GSAP` `OAuth` `Magic Link Auth`
