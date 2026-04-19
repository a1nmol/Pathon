# Pathon

**A two-sided career intelligence platform — built for job seekers and the teams hiring them.**

Live: [pathon.vercel.app](https://pathon.vercel.app)

---

## What It Is

Pathon is not a job board. Not a chatbot. Not another resume builder.

It's a full intelligence system that sits between every job seeker and every hiring team — one login, two complete product experiences, the same AI backbone powering both sides.

Sign in with a magic link. Pick your role. The platform routes you to the right experience automatically.

---

## For Job Seekers

| Feature | What it does |
|---|---|
| **Career Identity** | 20-question deep profile — thinking style, risk tolerance, career direction. Every AI feature uses this as context. |
| **AI Career Paths** | Claude generates 2–3 personalised career paths with alignment scores, skill gaps, and anti-recommendations. Rendered as a scroll-driven narrative. |
| **Next Best Action** | Dashboard command center that tells you the single highest-leverage move to make right now — not a progress bar. |
| **ATS Scanner** | Score your resume against any job description. Keyword hits, missing skills, specific fixes. Export as PDF. |
| **Cover Letter Generator** | Written from your actual resume, LinkedIn voice, and the job description. Two-column document layout. Export as PDF. |
| **Mock Interview** | Streaming AI interviewer. Generates STAR stories from your proof capsules. Role-fit analysis from any JD. |
| **Gap Analyzer** | Multi-agent system that identifies skill gaps and generates a prioritised learning plan. |
| **Salary Intelligence** | Market range research + AI negotiation practice against a simulated hiring manager. |
| **Application Tracker** | Kanban board for every application with ghost detection. |
| **LinkedIn Intelligence** | Upload your LinkedIn export ZIP — parsed client-side (never uploaded raw). Imports work history, posts, skills. AI extracts expertise signals. |
| **3D Skill Constellation** | Live Three.js graph of your skill landscape — owned, exploring, and gap nodes with decay animations. |
| **AI Shadow Mentor** | Streaming chat with full context of your career history. Cites your past decisions by date. |
| **Proof Capsules** | Structured decision records (6 sections: claim → context → constraints → reasoning → iterations → reflection). Feed into interview prep and AI matching. |
| **Career Story Generator** | First-person narrative essay from your proof capsules and work history. |
| **Offer Evaluator** | Paste any job offer — AI returns take / negotiate / decline with specific red flags and negotiation points. |
| **Failure Archive** | Private, localStorage-only space to log professional failures. Never sent to any server. |
| **Weekly Check-In** | 3 questions, once a week. AI reflection + one sharpening question for next week. |

---

## For Employers

| Feature | What it does |
|---|---|
| **AI Job Description Generator** | Describe a role in plain language — AI writes the full JD. Rich text editor with live preview. Export as PDF or Word. |
| **Candidate Pipeline** | Full Kanban hiring pipeline: Applied → Screening → Interview → Offer → Hired. |
| **Talent Pool** | Browse all candidates with profile snapshots and skill matching. |
| **Analytics** | Funnel metrics, conversion rates, time-in-stage, weekly trends. |
| **Company Profile** | Inline slide-out panel for company details, tech stack, and culture tags — feeds the AI job description generator. |

---

## Tech Stack

| Layer | Tools |
|---|---|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **AI** | Anthropic Claude (`claude-opus-4-6`) — 15+ AI modules, streaming responses, multi-agent gap analysis |
| **Auth** | Supabase Auth — magic link (PKCE) + Google OAuth + GitHub OAuth |
| **Database** | Supabase PostgreSQL — 15+ tables, Row Level Security on all tables, append-only memory |
| **3D** | Three.js, @react-three/fiber, @react-three/drei |
| **Animation** | Framer Motion, GSAP, Lenis |
| **Styling** | Tailwind CSS + CSS custom properties (30+ design tokens, dark/light theme) |
| **File parsing** | pdfjs-dist (resume PDF, client-side), jszip (LinkedIn export, client-side) |
| **Export** | Browser Print API (PDF), HTML Blob (Word .doc) — zero npm dependencies |
| **Deployment** | Vercel |

---

## Running Locally

**Prerequisites:** Node.js 18+, a Supabase project, an Anthropic API key.

```bash
git clone https://github.com/a1nmol/Pathon
cd Pathon
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
```

Run all migration files in `supabase/migrations/` in order via the Supabase SQL Editor, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with any email.

---

## Architecture

- **Server Components** for all data fetching — auth, database queries, AI calls
- **Client Components** for interactivity — connected via a Context bridge pattern
- **`CareerContext`** — a single normalised object assembled from all user data and passed to every Claude call, keeping all AI features coherent with each other
- **Append-only memory** — behavior logs, proof revisions, and path snapshots accumulate and feed back into increasingly personalised recommendations
- **Privacy-first file handling** — LinkedIn ZIPs and PDF resumes are parsed entirely in the browser before any data touches the server

---

## Team

Built by **Anmol Subedi**, **Samayara Rijal**, and **Praful Shrestha** for Hawkathon 2026.

---

## License

MIT
