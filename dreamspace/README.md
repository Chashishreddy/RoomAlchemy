# DreamSpace – AI Interior Design Visualizer

DreamSpace is a security-forward, full-stack web application that lets users upload a room photo, pick a design style, and receive an AI-generated redesign rendered by Stability AI (or any compatible diffusion service). The project emphasizes Security+ principles including secret management, access control, threat mitigation, and audit-ready logging.

## ✨ Features

- Modern responsive UI with drag-and-drop uploads, style selection, status messaging, and a before/after comparison slider.
- Secure Node.js/Express backend with CSP, strict CORS, rate limiting, centralized logging, and EXIF sanitization.
- Optional JWT-based RBAC scaffold with guest, user, and admin roles.
- Logging pipeline suitable for incident response (`logs/app.log` + in-memory metrics endpoint).
- Deployment-ready structure for hosting frontend (GitHub Pages/Vercel) and backend (Render/Railway/Fly.io).

## 🧱 Project Structure

```
dreamspace/
├── README.md
├── .env.example
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── backend/
    ├── package.json
    ├── .eslintrc.cjs
    ├── config.js
    ├── server.js
    ├── controllers/
    │   ├── healthController.js
    │   ├── metricsController.js
    │   └── redesignController.js
    ├── middleware/
    │   ├── auth.js
    │   ├── errorHandler.js
    │   ├── requestLogger.js
    │   └── validateRedesign.js
    ├── routes/
    │   ├── adminRoutes.js
    │   ├── healthRoutes.js
    │   └── redesignRoutes.js
    └── services/
        ├── logger.js
        ├── metricsService.js
        └── stabilityService.js
```

### High-Level Architecture

```
┌────────────────┐        HTTPS        ┌────────────────────┐
│  Frontend SPA  │ ─────────────────▶ │  Express API Layer  │
│  (static host) │                    │  (/api/* endpoints) │
└────────────────┘ ◀───────────────┐  └─────────┬──────────┘
        ▲                           │            │
        │ Styles, status, slider    │            │ Logs, metrics
        │                           │            ▼
        │                   ┌───────┴────────┐   ┌──────────────────────┐
        │                   │ Security Stack │   │   Stability AI API   │
        │                   │  Helmet + CSP  │   │ (image-to-image I/F) │
        │                   │  Rate Limiter  │   └──────────────────────┘
        │                   │  EXIF removal  │
        │                   │  JWT/RBAC      │
        │                   │  Audit logs    │
        │                   └───────────────┘
        │
        └── Download redesigned PNG directly from backend response
```

## 🚀 Getting Started

### 1. Clone & Install

```bash
cd dreamspace/backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and provide real values:

```bash
cp ../.env.example .env
```

| Variable | Description |
| --- | --- |
| `PORT` | Port for the Express server (default `8080`). |
| `STABILITY_API_KEY` | Your Stability AI API key (never exposed to the client). |
| `STABILITY_API_BASE` | Base URL for the Stability API (default `https://api.stability.ai`). |
| `JWT_SECRET` | Secret for signing JWT tokens if authentication is enabled. |
| `ALLOWED_ORIGINS` | Comma-separated list of trusted frontend origins. |
| `RATE_LIMIT_MAX` | Max requests per IP during the rate limit window. |
| `RATE_LIMIT_WINDOW` | Window for rate limiting (`1m`, `30s`, etc.). |
| `LOG_LEVEL` | Winston log level (`info`, `debug`, etc.). |
| `AUTH_OPTIONAL` | `true` to allow unauthenticated use, `false` to require JWT. |

### 3. Run the Backend

```bash
npm run dev
```

The API is available at `http://localhost:8080`. Key endpoints:

- `GET /api/health` – uptime + timestamp.
- `POST /api/redesign` – multipart upload (`image`, `style`). Returns redesigned PNG.
- `GET /api/admin/metrics` – RBAC-protected usage metrics (requires `admin` role JWT).

### 4. Serve the Frontend

The frontend is a static build. You can open `frontend/index.html` directly in a browser during development or serve it via any static host. For local testing alongside the backend, consider using `npm install -g serve` and run `serve dreamspace/frontend` with CORS configured accordingly.

## 🔐 Security Posture Highlights

- **Secret Management:** Stability API key is sourced from server-side environment variables. No client-side exposure or configuration.
- **Content Security Policy:** Helmet enforces CSP (`default-src 'self'`) preventing mixed content or untrusted script injection.
- **Rate Limiting & Availability:** `express-rate-limit` restricts `/api/*` to configurable thresholds, mitigating DoS/abuse.
- **CORS Hardening:** Only approved origins (via `ALLOWED_ORIGINS`) can access the API.
- **Data Sanitization:** Uploaded images are validated (type + size) and processed with `sharp` to strip EXIF metadata before reaching third-party services.
- **Logging & Incident Response:** Winston streams structured JSON logs to `logs/app.log`, capturing method, IP, status, style, and duration. Metrics endpoint exposes recent usage for triage.
- **Access Control Scaffold:** JWT middleware supports guest/user/admin roles. Admin-only metrics route demonstrates RBAC enforcement.

## 🧪 Quality & Maintenance

- **Linting:** `npm run lint` (ESLint) ensures consistent, secure JavaScript standards.
- **Modularity:** Controllers, middleware, and services are separated for clarity and unit-test readiness.
- **Extensibility:** Swap the Stability API engine or integrate queued processing by adjusting `services/stabilityService.js`.

## ☁️ Deployment Notes

- **Frontend:** Deploy `frontend/` to GitHub Pages, Vercel, or Netlify. Update `ALLOWED_ORIGINS` with the production domain.
- **Backend:** Deploy `backend/` to Render, Railway, Fly.io, etc. Ensure environment variables are set securely and logging volumes are persisted.
- **TLS:** Use HTTPS terminators on your hosting platform to protect uploads and responses in transit.

## 📄 License

MIT — customize as needed.
