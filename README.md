# RoomAlchemy – AI Interior Design Visualizer

RoomAlchemy securely transforms real room photos into fresh interior design concepts using Stability AI's image-to-image models. This repository delivers a production-ready demo stack with hardened backend, secure logging, RBAC enforcement, and a fast vanilla JS frontend.

```
                ┌────────────────────┐
                │     Frontend       │
                │  (HTML/CSS/JS)     │
                └────────┬──────────┘
                         │ HTTPS
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                      Express Backend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Security &  │  │ Auth + RBAC │  │  Redesign Controller │  │
│  │ Rate Limits │  │  JWT/Quota  │  │  (EXIF → Stability)  │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬──────────┘  │
│         │                │                     │             │
│         ▼                ▼                     ▼             │
│  Logging & Audit  ← Metrics Store →  MongoDB / Splunk (opt)   │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
                Stability AI Image-to-Image API
```

## Getting Started

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

The server listens on `PORT` (default `8080`).

### 2. Frontend

Serve the static assets from `/frontend` using any static file server:

```bash
npm install -g http-server
http-server ./frontend -p 5173
```

Visit `http://localhost:5173` (allowed origin by default). The frontend communicates with the backend at `http://localhost:8080`.

## Environment Variables

| Variable | Description |
| --- | --- |
| `PORT` | Backend listening port. |
| `NODE_ENV` | `development` or `production` for logging & helmet nuances. |
| `ALLOWED_ORIGINS` | Comma-separated list of permitted frontend origins for CORS. |
| `STABILITY_API_BASE` | Stability AI API base URL (default `https://api.stability.ai`). |
| `STABILITY_API_KEY` | **Required**. Server-side Stability key (never exposed to the client). |
| `JWT_SECRET` | Secret used to sign JWT access tokens. Change in production. |
| `AUTH_OPTIONAL` | If `true`, unauthenticated guests can redesign rooms (subject to quota). |
| `GUEST_DAILY_QUOTA` | Max guest redesigns per 24h (default `3`). |
| `RATE_LIMIT_MAX` | Requests allowed per window (default `5`). |
| `RATE_LIMIT_WINDOW` | Window duration (supports `ms`, `s`, `m`, `h`). |
| `LOG_LEVEL` | Winston log level (`info`, `debug`, etc.). |
| `MONGO_URI` | Optional MongoDB connection string for SIEM log export. |
| `SPLUNK_HEC_URL` | Optional Splunk HTTP Event Collector endpoint. |
| `SPLUNK_HEC_TOKEN` | Optional Splunk HEC token.

Copy `.env.example` to `.env` and populate secrets:

```bash
cp .env.example backend/.env
# edit backend/.env
```

## Security Architecture

RoomAlchemy applies multiple layers of defense (mapped to CompTIA Security+ domains):

- **Least privilege & secret management (2.1, 2.2)** – Stability API keys live only on the server (`backend/services/stabilityClient.js`). Client requests never see the secret.
- **Strong authentication & RBAC (4.2)** – JWT-based login/logout with role enforcement (`guest`, `user`, `admin`). Middleware guards admin routes.
- **Rate limiting & abuse mitigation (2.7)** – Dual express-rate-limit policies (global + `/api/redesign`) with JSON 429 responses.
- **Input validation & sanitization (1.6)** – Multer enforces MIME and size; server whitelists style presets and strips EXIF via Sharp.
- **Secure headers & CSP (2.8)** – Helmet with strict CSP, CORS allow-list, and no inline scripts except styles.
- **Comprehensive logging & monitoring (5.1)** – Winston request logs (`backend/logs/app.log`), optional MongoDB/Splunk export, metrics aggregation for SIEM.
- **Incident response readiness (5.3)** – Audit trail covers request identity, IP, role, outcome, and timings for forensic analysis.
- **Data protection (2.5)** – Original uploads stay in memory, sanitized filenames, and antivirus hook for future ClamAV integration.

## Guest Quota & Authentication

- **Guest usage**: When `AUTH_OPTIONAL=true`, unauthenticated visitors are treated as guests. They receive up to `GUEST_DAILY_QUOTA` redesigns per 24 hours based on IP (or user ID if authenticated as guest role).
- **Demo accounts** (for testing JWT flows):
  - `guest@roomalchemy.io` / `guestpass`
  - `user@roomalchemy.io` / `userpass`
  - `admin@roomalchemy.io` / `adminpass`
- **Obtaining an admin token**:

  ```bash
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@roomalchemy.io","password":"adminpass"}'
  ```

  Use the returned JWT in the `Authorization: Bearer <token>` header to access `/api/admin/metrics`.

- **Logout**:

  ```bash
  curl -X POST http://localhost:8080/api/auth/logout \
    -H "Authorization: Bearer <token>"
  ```

  Tokens are blacklisted in memory; reuse results in `401` until the process restarts.

## Metrics & Logging

- **Logs**: All requests and redesign events stream to `backend/logs/app.log`.
- **Metrics API**: Admins can query `/api/admin/metrics` for `totalRequests`, `totalRedesigns`, `redesignsByStyle`, `errorsByType`, `topIPs`, and `last24hCounts`.
- **MongoDB integration**: Set `MONGO_URI` to enable event persistence. The server creates/uses an `events` collection.
- **Splunk HEC**: Provide both `SPLUNK_HEC_URL` and `SPLUNK_HEC_TOKEN` to forward JSON events non-blockingly.

## Frontend Experience

- Drag-and-drop uploader with file picker fallback.
- Style presets: Minimalist, Japandi, Cozy Scandinavian, Luxury Modern, Cyberpunk Neon, Warm Boho.
- Accessible live status messaging, spinner indicator, and before/after comparison slider.
- Download button for the final PNG (returned from backend).

## Optional Deployment Notes

- **Frontend**: Any static host (Vercel, Netlify, GitHub Pages). Update `ALLOWED_ORIGINS` to include production URLs.
- **Backend**: Deploy to Render, Railway, Fly.io, etc. Ensure environment variables are set securely and configure reverse proxies (e.g., Nginx) for TLS and extra rate limiting if required.
- **Edge protection**: For production, add Web Application Firewall (Cloudflare/Nginx) rules mirroring the IP rate limits and rejecting large bodies.

## Extending Security

- Integrate ClamAV scanning by replacing `backend/services/avScan.js` with a socket call to `clamd` and enforce `clean === true` before Stability submission.
- Connect MongoDB events to your SIEM or analytics pipelines.
- Configure Splunk HEC to monitor `redesign_event` spikes or suspicious IP activity in near real-time.

RoomAlchemy keeps sensitive operations on the backend, ensuring Stability AI credentials, quotas, and audit logs remain protected while delivering a polished user experience.
