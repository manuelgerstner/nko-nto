<p align="center">
  <img src="nko-nto-frontend/public/nko-nto-logo.png" alt="nko-nto logo" width="240" />
</p>

# nko-nto

A self-hosted invoicing and expense tracking application for small businesses. Manage invoices, bills, contacts, exchange rates, and team members from a single web interface.

---

## Features

- **Dashboard** — at-a-glance overview: outstanding invoices, unpaid bills, net balance, and contact count
- **Invoices** — create, edit, and track outgoing invoices with line items, VAT, and statuses (Draft → Sent → Paid / Overdue / Cancelled)
- **Bills** — record incoming supplier bills with line items, categories, and statuses (Pending → Paid / Overdue / Cancelled)
- **Contacts** — manage customers and suppliers with address, VAT ID, and default currency
- **Exchange rates** — daily rates fetched automatically from the European Central Bank (ECB); manual fetch and historical backfill available
- **Multi-currency** — configure a primary and optional secondary currency; line items track the invoice/bill currency
- **Tax year** — choose between a regular calendar year (1 Jan – 31 Dec) or the South African tax year (1 Mar – 28/29 Feb)
- **Team** — invite additional users to your company workspace via single-use invite links
- **Data import** — bulk import contacts, invoices, and bills from XLSX/CSV files
- **API docs** — Swagger UI available at `/api/swagger-ui.html`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Material UI v9 |
| Backend | Spring Boot 3.3, Java 21 |
| Database | PostgreSQL 15 (Flyway migrations) |
| Auth | Firebase Authentication + Firebase Admin SDK |
| Web server | nginx + OWASP ModSecurity CRS WAF |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A [Firebase](https://firebase.google.com/) project (free Spark plan is sufficient)

---

## Firebase Setup

Authentication is handled by Firebase. You need to configure it once on both the frontend (build-time env vars) and the backend (a service account JSON file).

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Add project**.
2. Give it a name (e.g. `nko-nto`) and follow the wizard.

### 2. Enable Email/Password authentication

1. In your Firebase project, go to **Authentication → Sign-in method**.
2. Enable **Email/Password**.

### 3. Get the frontend config

1. In the Firebase console go to **Project settings → General**.
2. Under **Your apps**, click **Add app → Web**.
3. Register the app (no need to set up Firebase Hosting).
4. Copy the config values — you will need:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`

### 4. Generate a service account key (for the backend)

1. In the Firebase console go to **Project settings → Service accounts**.
2. Click **Generate new private key** → **Generate key**.
3. Save the downloaded JSON file as `nko-nto-backend/src/main/resources/firebase-config.json`.

> **Keep this file secret.** It grants admin access to your Firebase project. Do not commit it to version control — add the path to `.gitignore`.

---

## Self-Hosting with Docker Compose

### 1. Clone the repository

```bash
git clone <repo-url> nko-nto
cd nko-nto
```

### 2. Add the Firebase service account

Place your service account JSON (from Firebase setup step 4 above) at:

```
nko-nto-backend/src/main/resources/firebase-config.json
```

### 3. Configure `docker-compose.yml`

Edit `docker-compose.yml` and fill in your values:

```yaml
services:
  frontend:
    build:
      context: './nko-nto-frontend'
      args:
        VITE_API_BASE_URL: https://your-domain.com/api
        VITE_FIREBASE_API_KEY: <your-firebase-apiKey>
        VITE_FIREBASE_AUTH_DOMAIN: <your-project>.firebaseapp.com
        VITE_FIREBASE_PROJECT_ID: <your-project-id>
        VITE_FIREBASE_APP_ID: <your-firebase-appId>
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - letsencrypt:/etc/letsencrypt:ro   # remove if not using HTTPS

  backend:
    build: './nko-nto-backend'
    environment:
      DATABASE_HOST: postgres
      DATABASE_USER: postgres
      DATABASE_PW: '<strong-password>'
    ports:
      - "127.0.0.1:10001:10001"

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: '<strong-password>'
      POSTGRES_DB: nko-nto
    volumes:
      - ./pgdata:/var/lib/postgresql/data

volumes:
  letsencrypt:
```

Make sure `DATABASE_PW` in the backend matches `POSTGRES_PASSWORD` in the postgres service.

### 4. Build and start

```bash
docker compose up -d --build
```

The frontend is served on port 80 (and 443 if HTTPS is configured). nginx proxies all `/api` requests to the backend container — no direct backend port exposure is needed in production.

### 5. First-time registration

1. Open the app in your browser.
2. Click **Sign up** and create an account with your email and password.
3. Firebase will send a verification email — verify your address before logging in.
4. On first login the app prompts you for your name and company name to complete registration. This creates your company workspace.

The email address listed under `nkonto.security.super-admins` in `application.yml` receives elevated admin access.

---

## HTTPS / TLS

The frontend Dockerfile uses the OWASP ModSecurity nginx image. For production HTTPS:

1. Obtain a certificate with certbot/Let's Encrypt (webroot mode works with `nginx-certs.conf`).
2. Mount the `/etc/letsencrypt` volume into the frontend container (already in the example above).
3. Use `nginx-ssl.conf.example` as a starting point for your nginx SSL server block.

---

## Environment Variables Reference

### Backend

Passed via `docker-compose.yml` → `backend.environment`:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_HOST` | `localhost` | PostgreSQL hostname |
| `DATABASE_USER` | `postgres` | PostgreSQL username |
| `DATABASE_PW` | `postgres` | PostgreSQL password |
| `FIREBASE_SERVICE_ACCOUNT` | `classpath:firebase-config.json` | Path or classpath resource for the Firebase service account JSON. The default embeds the file from `src/main/resources/` at build time. |

CORS allowed origins are configured in `nko-nto-backend/src/main/resources/application.yml` under `nkonto.cors.allowed-origins`.

### Frontend

Passed as Docker build args (baked into the static build at image build time):

| Arg | Description |
|---|---|
| `VITE_API_BASE_URL` | Full URL to the backend API (e.g. `https://your-domain.com/api`) |
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain (e.g. `your-project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID |

---

## Local Development

### Backend

Requires Java 21 and a running PostgreSQL instance with a database named `nko-nto`.

```bash
cd nko-nto-backend
./gradlew bootRun
```

The API starts on `http://localhost:10001/api`. Swagger UI is available at `http://localhost:10001/api/swagger-ui.html`.

### Frontend

```bash
cd nko-nto-frontend
npm install
npm run dev
```

Create `nko-nto-frontend/.env.local` with your local values:

```env
VITE_API_BASE_URL=http://localhost:10001/api
VITE_FIREBASE_API_KEY=<your-apiKey>
VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_APP_ID=<your-appId>
```

The dev server starts on `http://localhost:3000`.

---

## Team Invitations

To add more users to your company workspace:

1. Go to **Settings → Team**.
2. Click **Generate invite link** — a single-use link is created and copied to your clipboard automatically.
3. Share the link with the new team member.
4. They open the link, sign up (or log in) with Firebase, and are automatically added to your company with the `USER` role.

Invite links expire after 7 days and can only be used once.

---

## Exchange Rates

Rates are fetched daily from the [European Central Bank SDMX API](https://data-api.ecb.europa.eu) and stored relative to EUR (1 EUR = X foreign currency). The currencies to track are configured in `application.yml` under `nkonto.currencies`.

From **Settings → Exchange Rates** you can also:
- **Fetch Now** — trigger an immediate fetch of the latest rates
- **Backfill** — import historical daily rates for a given currency and date range

---

## Project Structure

```
nko-nto/
├── docker-compose.yml
├── nko-nto-frontend/            React + Vite SPA
│   ├── src/
│   │   ├── pages/               Route-level page components
│   │   ├── sections/            Feature-level view components
│   │   ├── utils/api.js         Axios client (attaches Firebase ID token to every request)
│   │   └── firebase.js          Firebase SDK initialisation
│   ├── nginx.conf               nginx config (proxies /api → backend container)
│   └── Dockerfile               Multi-stage: Vite build → OWASP ModSecurity nginx
└── nko-nto-backend/             Spring Boot REST API
    ├── src/main/java/de/nkotech/nkonto/
    │   ├── controller/          REST endpoints (invoices, bills, contacts, auth, …)
    │   ├── service/             Business logic
    │   ├── persistence/         JPA entities + Spring Data repositories
    │   └── security/            Firebase token filter + Spring Security config
    ├── src/main/resources/
    │   ├── application.yml      App configuration
    │   ├── db/migration/        Flyway SQL migrations (V1–V9)
    │   └── firebase-config.json ← place your service account file here
    └── Dockerfile               Multi-stage: Gradle build → slim JRE image
```
