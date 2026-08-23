# AEGIS-AI Frontend

A public-facing, multi-page, animated frontend for **AEGIS-AI** — the IBM-Bob-powered cybersecurity awareness assistant.

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Build | **Vite + React + TypeScript** | Fast HMR, lean bundle |
| Styling | **Tailwind CSS v4 (Vite plugin)** | Utility-first, no runtime |
| Animations | **Framer Motion** | Smooth 60fps, reduced-motion aware |
| Routing | **React Router v7** | Client-side SPA routing |
| Icons | **Lucide React** | Consistent, accessible SVG icons |

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing / Hero | Scroll-driven hero, stats strip, risk level showcase, trust signals |
| `/how-it-works` | How It Works | Scroll-animated four-step pipeline (OCR → IBM Bob → Risk Score) |
| `/scanner` | Live Scanner | Real API integration — file upload + URL/text input |
| `/results` | Results | Animated risk gauge, explanation, recommendations, extracted text |
| `/threats` | Threat Library | Searchable + filterable reference of all threat types |
| `/about` | About | Mission, principles, tech stack, team, disclaimer |

## Development

```bash
npm install
cp .env.example .env.local   # optional — defaults to /api proxy
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:5000` (your backend).
To point at a different backend: set `VITE_API_BASE` in `.env.local`.

## Production Build

```bash
npm run build   # outputs to dist/
```

Serve `dist/` with any static host (Nginx, Vercel, Netlify, etc.).  
Ensure the backend is reachable and CORS is configured for your production origin.

## API Contract

The frontend expects the backend at `/api/scan` (POST, multipart) and `/api/scan-url` (POST, JSON) to return:

```json
{
  "extracted_text": "string",
  "risk_level": "safe | low | medium | high | critical",
  "threat_category": "string",
  "explanation": "string",
  "recommendations": ["string"]
}
```

## Accessibility

- All interactive elements are keyboard-navigable with visible `:focus-visible` outlines
- `aria-label`, `aria-expanded`, `role` attributes throughout
- Decorative elements marked `aria-hidden="true"`
- `@media (prefers-reduced-motion: reduce)` disables all animations
- Colour contrast meets WCAG AA for all text/background pairs
