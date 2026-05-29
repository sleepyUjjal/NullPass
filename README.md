# NullPass

NullPass is a passwordless authentication demo built with Django and React. Instead of passwords or OTPs, it uses a challenge-response flow where a trusted device signs a server-issued nonce with a locally stored private key. The server verifies that signature with the device's public key, then issues a JWT-backed session.

This repository already includes:

- A Django backend for device enrollment, challenge generation, signature verification, session handling, audit logging, and dashboard APIs
- A React + Vite frontend for enrollment, QR-based login, simulated authenticator flow, and a security dashboard
- Admin views for trusted devices, challenges, events, and sessions
- Optional hooks for blockchain-backed audit logging metadata

## What This Project Is

NullPass is best understood as a working prototype of device-bound, passwordless login.

- It demonstrates cryptographic authentication without passwords or SMS/email OTPs
- It shows how QR-driven cross-device login can work with signed challenges
- It keeps an audit trail of authentication activity
- It visualizes security activity in a dashboard

## What This Project Is Not Yet

A few important limitations are visible in the current codebase:

- There is no user account model or multi-user tenancy yet; the system is currently device-centric
- Private keys are generated in the browser and stored in `localStorage`, which is fine for a demo but not production-grade key custody
- The dashboard exposes system-wide device and event data, not per-user scoped data
- Blockchain logging is only scaffolded; the `blockchain_audit` app/service referenced by the models is not included in this repo
- Automated tests are placeholders right now

## Stack

- Backend: Django 6, Django REST Framework
- Frontend: React 19, Vite, Tailwind CSS 4, Framer Motion, Chart.js
- Crypto: Web Crypto API on the client, ECDSA signature verification on the server
- Session model: JWT plus HTTP-only cookie
- Database: SQLite by default, with PostgreSQL/MySQL support through environment settings

## Repository Layout

```text
NullPass/
├── backend/
│   ├── authenticate/         # Enrollment, login, signature verification, sessions
│   ├── dashboard/            # Dashboard and security stats APIs
│   ├── nullpass/             # Django project settings and URL routing
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # Shared UI pieces
│   │   ├── pages/            # Home, login, enroll, dashboard, docs, authenticator
│   │   ├── services/         # Axios API wrapper
│   │   └── utils/            # Browser crypto helpers
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## How It Works

### Device enrollment

1. The frontend requests an enrollment QR from `POST /api/auth/enroll/qr`
2. The user opens the authenticator page
3. The browser generates an ECDSA keypair with Web Crypto
4. The public key is sent to the backend and stored as a `TrustedDevice`
5. The private key and device metadata are stored in browser `localStorage`

### Login flow

1. The frontend requests a login challenge from `POST /api/auth/login/request`
2. The backend creates an `AuthenticationChallenge` and returns a QR code plus challenge data
3. The trusted device signs `challenge_id + nonce`
4. The backend verifies the signature against the enrolled public key
5. On success, the backend marks the challenge used, creates a `UserSession`, and returns a JWT session token
6. The browser polls challenge status and is redirected to the dashboard once authenticated

### Security data

The backend records events such as:

- device enrollment
- successful login
- invalid signature attempts
- session termination
- device deactivation

Those events power the dashboard threat summary and statistics endpoints.

## Local Development

### Prerequisites

- Python 3.12+ recommended
- Node.js 20+ recommended
- `npm`

### 1. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create an environment file at `backend/nullpass/.env`.

Example:

```env
SECRET_KEY=dev-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

FRONTEND_BASE_URL=http://localhost:5173

JWT_SECRET_KEY=replace-this-for-real-use
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

CHALLENGE_EXPIRATION_MINUTES=5
ENROLLMENT_CHALLENGE_EXPIRATION_MINUTES=10
MAX_FAILED_ATTEMPTS=5

DB_ENGINE=sqlite3
DB_NAME=db.sqlite3

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173,http://127.0.0.1:5173

BLOCKCHAIN_ENABLED=False
LOG_LEVEL=INFO
SECURITY_LOG_LEVEL=WARNING
```

Run migrations and start Django:

```bash
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Vite runs on `http://localhost:5173` by default and proxies `/api` requests to Django on `http://127.0.0.1:8000`.

### 3. Open the app

Use the frontend app at:

- `http://localhost:5173/`

Main demo routes:

- `/` - landing page with live login widget
- `/enroll` - enroll a browser as a trusted device
- `/login` - QR login flow
- `/authenticate` - simulated authenticator view
- `/dashboard` - security dashboard
- `/docs` - in-app product documentation page

## Easiest Demo Flow

Because this repo includes a simulated authenticator page, the quickest way to test it is:

1. Open `http://localhost:5173/enroll`
2. Click the QR area to simulate scanning
3. Register the current browser as a trusted device
4. Go to `http://localhost:5173/login`
5. Click the QR area again to simulate authentication
6. Wait for redirect to the dashboard

This works in one browser using multiple tabs. You can also expose the frontend on your LAN and use a second device, but the current implementation is primarily optimized for demo/simulation.

## Environment Variables

The backend reads environment values from `backend/nullpass/.env` first, then falls back to OS environment variables.

Common settings:

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Enables Django debug mode |
| `ALLOWED_HOSTS` | Django allowed hosts list |
| `FRONTEND_BASE_URL` | Base URL used in generated QR login/enrollment links |
| `JWT_SECRET_KEY` | Secret used to sign session tokens |
| `JWT_EXPIRATION_HOURS` | Session lifetime |
| `CHALLENGE_EXPIRATION_MINUTES` | Login challenge validity |
| `ENROLLMENT_CHALLENGE_EXPIRATION_MINUTES` | Enrollment challenge validity |
| `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Direct database config |
| `DATABASE_URL` | Alternative database config string |
| `CORS_ALLOWED_ORIGINS` | Frontend origins allowed to call the API |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for Django CSRF handling |
| `BLOCKCHAIN_ENABLED` | Enables optional blockchain audit hook |
| `LOG_LEVEL`, `SECURITY_LOG_LEVEL` | Logging verbosity |

## API Overview

### Authentication endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/enroll` | Enroll a device with `device_id`, `public_key`, and optional `device_name` |
| `POST` | `/api/auth/enroll/qr` | Generate an enrollment QR |
| `POST` | `/api/auth/login/request` | Create a login challenge and QR |
| `POST` | `/api/auth/verify` | Verify a signed challenge |
| `GET` | `/api/auth/challenge/status` | Poll challenge state from the browser |
| `POST` | `/api/auth/session/validate` | Validate cookie or bearer token session |
| `POST` | `/api/auth/logout` | End the current session |

### Dashboard endpoints

All dashboard routes require a valid session token.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/statistics/` | Aggregate counts for devices, sessions, and events |
| `GET` | `/api/dashboard/threat-summary/` | Threat summary, failed attempts, trust level, recent attacks |
| `GET` | `/api/dashboard/events/` | Recent authentication events |
| `GET` | `/api/dashboard/sessions/` | Active sessions |
| `POST` | `/api/dashboard/terminate-session/` | Terminate a session by `session_id` |
| `GET` | `/api/dashboard/devices/` | List registered devices |
| `POST` | `/api/dashboard/deactivate-device/` | Deactivate a device by `device_id` |

## Data Model

Key backend models in `backend/authenticate/models.py`:

- `TrustedDevice` - enrolled devices, public keys, device status, failed attempt count
- `AuthenticationChallenge` - one-time challenges with expiration and used-state tracking
- `AuthenticationEvent` - audit log for login and security events
- `UserSession` - active JWT-backed sessions associated with a device

## Logging

On startup, Django creates `backend/logs/` if it does not already exist.

- `backend/logs/nullpass.log` - application logging
- `backend/logs/security.log` - authentication/security-focused logging

## Serving the Frontend Through Django

The codebase currently supports two patterns:

### Recommended for development

Run Django and Vite separately:

- Django on `:8000`
- Vite on `:5173`
- Vite proxies `/api` to Django

### Optional for built SPA hosting

Build the frontend:

```bash
cd frontend
npm run build
```

If you want Django to serve the built SPA, make sure `TEMPLATE_DIRS` points at `frontend/dist`, because the default `frontend/index.html` is a Vite source template, not the production build output.

Useful values:

```env
TEMPLATE_DIRS=../frontend/dist
STATICFILES_DIRS=../frontend/dist/assets
STATIC_URL=/assets/
```

## Important Caveats

These are worth knowing before you treat the repo as production-ready:

- The frontend stores the generated private key in `localStorage`
- Cookie settings in `backend/authenticate/views.py` currently use `secure=True`, which can prevent session cookies from sticking on plain HTTP localhost setups
- The in-app `/docs` page is marketing-oriented and does not accurately reflect every real API route in the code
- `frontend/src/App.css`, `frontend/README.md`, and some placeholder test files are leftover scaffold files
- Blockchain support is referenced, but the implementation package is not present in this repository

If you are extending this project, the highest-value next steps are:

- move key storage to platform authenticators or secure hardware-backed storage
- add real user identities and per-user authorization boundaries
- replace custom browser-key flows with WebAuthn / passkey support
- add automated tests for enrollment, verification, and dashboard authorization
- make cookie security and same-site behavior environment-driven

## Admin

Django admin is configured for the authentication models.

To create an admin user:

```bash
cd backend
python manage.py createsuperuser
```

Then open:

- `http://127.0.0.1:8000/admin/`

## Current State of the Repo

After reading the codebase, the project is in a strong prototype/demo state:

- the core cryptographic login loop is implemented
- the dashboard APIs and UI are wired up
- environment-driven settings are in place
- the production hardening, user model, blockchain module, and tests are still incomplete

That makes this repo a good foundation for a passwordless authentication proof-of-concept, internal demo, or learning project, and a reasonable starting point for a more production-oriented rewrite around passkeys/WebAuthn.
