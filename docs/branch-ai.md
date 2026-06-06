# Branch MVP — Claude Code Spec

## Overview

Branch is a web app for dyslexic secondary school students. It lets students upload study documents and get back a clean, dyslexia-friendly version with colour-coded keywords and better structure.

This is an MVP built for a pilot with ~30 students at Clongowes Wood College in September. The priority is a clean, working core loop. Features will be added incrementally — keep all code modular, readable, and easy to extend.

---

## Tech Stack

- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database & Auth**: Supabase (auth + file storage + database)
- **AI**: Google Gemini API (gemini-2.5-flash)
- **Hosting**: Vercel
- **Email**: Resend (not needed for MVP Phase 1)

---

## Design Reference

Jonny has built a prototype UI. Key design decisions to carry over:

### Colours
- Background: `#FDFBF7` (creamy off-white — reduces glare)
- Primary green (dark): `#114227`
- Primary green (mid): `#4A5D4C`
- Primary green (light): `#7A9E7E`
- Accent background: `#EAF0E7`
- Border/divider: `#E6E2D3`
- Text: `#333333`

### Keyword tile colours (3 priority tiers)
- **Lavender** `#E6E6FA` / `#D1D1F5` — core concepts (must know to pass)
- **Orange** `#FFE5D9` / `#F5D1C4` — supporting details (B/C grade)
- **Red/Rose** `#FEE2E2` / `#FCA5A5` — advanced/expert detail (A grade)

### Typography (dyslexia-friendly)
- Default font: **Lexend** (load from Google Fonts)
- Also support: OpenDyslexic, Atkinson Hyperlegible, Comic Neue, Inter
- Font size: 18px default
- Line height: 1.8
- Letter spacing: 2px
- Word spacing: 0.15em
- These should be adjustable by the student via a settings panel

### General UI principles
- Minimal distractions — no unnecessary UI elements
- Generous whitespace and padding
- Rounded corners (rounded-2xl / rounded-3xl)
- Soft shadows
- No harsh full-black text on white — use `#333333` on `#FDFBF7`

---

## Authentication

- Use **Supabase Auth** (email + password)
- Students are added manually by the admin (no public sign-up for pilot)
- On login, redirect to `/dashboard`
- Simple login page — just email and password, Branch logo, clean layout
- No password reset needed for pilot

---

## Pages & Routes

### `/` — Login page
- Branch logo + name
- Email + password fields
- Login button
- No sign-up link (pilot only)

### `/dashboard` — Student dashboard (protected)
- Shows student's uploaded documents
- Upload button to add a new document
- Each document shows: title, upload date, link to view processed version
- Simple, uncluttered layout

### `/document/[id]` — Processed document view (protected)
- Shows the AI-processed, dyslexia-friendly version of the document
- Reading settings panel (font, size, spacing, background tint)
- Colour-coded keyword tiles
- (More features to be added in later phases)

---

## Core Feature: Upload & Process

This is the most important feature. Everything else builds on top of it.

### Upload flow
1. Student clicks upload on dashboard
2. Selects a file: **PDF, image (JPG/PNG), or Word doc (.docx)**
3. File is uploaded to **Supabase Storage**
4. A record is created in the `documents` table (status: `processing`)
5. The API extracts the text from the file
6. The text is sent to **Gemini** with the processing prompt (see below)
7. The structured JSON response is saved to the `documents` table (status: `complete`)
8. Student is redirected to `/document/[id]` to view the result

### File text extraction
- **PDF**: Use `pdf-parse` npm package
- **Image**: Send directly to Gemini vision (it can read text from images natively)
- **DOCX**: Use `mammoth` npm package to extract raw text

### Gemini processing prompt

Use this system instruction (taken from Jonny's prototype — proven to work well):

```
You are a specialized Study Note Formatter for students with dyslexia.
Your task is to take standard, dense reading prose, rewrite/reformat it into clean study sections, and highlight key terms as "coloured tiles".

Tile Colour Categorisation Guide:
1. "lavender": Major primary key concepts, core vocabulary, primary terms (e.g. "photosynthesis", "mitochondria").
2. "orange": Secondary important concepts, verbs, actions, main ideas (e.g. "primary purpose", "convert").
3. "red": Advanced detail, expert-level terms, A-grade knowledge (e.g. "adenosine triphosphate").

Formatting Guidelines:
- Limit highlighted tiles to around 8–15% of the text. Do not over-highlight — this becomes visually overwhelming.
- Break dense blocks into smaller paragraphs, bullet points, or quiz checkpoints.
- Each section must have a type: "paragraph", "bullet", "quiz_header", or "quiz_option".
- Inside each section, split the text into sequential segments. A segment is either a highlighted tile or a plain text run.
```

Return structured JSON in this format:

```json
{
  "title": "string",
  "sections": [
    {
      "sectionType": "paragraph" | "bullet" | "quiz_header" | "quiz_option",
      "segments": [
        {
          "text": "string",
          "isTile": false
        },
        {
          "text": "keyword",
          "isTile": true,
          "color": "lavender" | "orange" | "red",
          "phonics": "pho-to-syn-the-sis",
          "explanation": "Simple plain-English definition"
        }
      ]
    }
  ]
}
```

---

## Database Schema (Supabase)

### `profiles` table
| column | type | notes |
|---|---|---|
| id | uuid | references auth.users |
| email | text | |
| full_name | text | |
| created_at | timestamp | |

### `documents` table
| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | references profiles.id |
| title | text | filename or extracted title |
| file_path | text | path in Supabase Storage |
| file_type | text | "pdf", "image", "docx" |
| status | text | "processing" \| "complete" \| "error" |
| processed_content | jsonb | the structured JSON from Gemini |
| created_at | timestamp | |

---

## API Routes

### `POST /api/upload`
- Accepts multipart form data (file)
- Uploads file to Supabase Storage
- Creates document record
- Triggers processing
- Returns `{ documentId }`

### `POST /api/process/[id]`
- Extracts text from file (pdf-parse / mammoth / Gemini vision)
- Sends to Gemini with the processing prompt
- Saves structured JSON to `documents.processed_content`
- Updates status to `complete`

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

---

## Important Notes for Claude Code

- This is an **MVP for a pilot**. Prioritise working code over perfect code.
- Features will be added one at a time. Keep components small and modular so they're easy to extend.
- The design should follow the colour palette and typography above closely — the UI is important for dyslexic students.
- Do not add features that aren't listed here. When the core loop works, new features will be added in separate sessions.
- Use the **App Router** (not Pages Router) in Next.js.
- Use **Supabase SSR** package (`@supabase/ssr`) for auth in Next.js App Router.
- Use **TypeScript**.
- Keep Tailwind classes consistent with the colour palette defined above.