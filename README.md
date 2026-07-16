# Budgeteer

Invoice tracking and budget management application.

## Tech Stack

- **Runtime:** Bun
- **Backend:** Elysia + Drizzle ORM + SQLite
- **Frontend:** React 19 + TanStack Router/Query/Form + Vite + Tailwind CSS v4
- **UI:** Shadcn UI (Base UI primitives)
- **Auth:** better-auth (email/password)

## Development

```bash
bun install
bun run dev
```

Frontend: http://localhost:5173
API: http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | API server port |
| `FRONTEND_URL` | Yes | - | CORS origin (e.g. `https://budgeteer.example.com`) |
| `BETTER_AUTH_SECRET` | Yes | - | Secret for session signing (generate with `openssl rand -base64 32`) |
| `VITE_API_URL` | No | `http://localhost:3000` | API URL the frontend connects to |
| `VITE_DATE_FORMAT` | No | `YYYY-MM-DD` | Display date format |

## Build

```bash
bun run build    # builds frontend to apps/web/dist/
bun run start    # starts API server
```

## VPS Deployment (Caddy)

### Prerequisites

- Ubuntu 22.04+ VPS
- Domain pointed to your VPS IP
- SSH access as root or sudo user

### 1. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 2. Install Caddy

```bash
sudo apt update
sudo apt install -y caddy
```

### 3. Clone and configure

```bash
sudo mkdir -p /opt/budgeteer
sudo chown $USER /opt/budgeteer
git clone <your-repo-url> /opt/budgeteer
cd /opt/budgeteer
```

### 4. Create `.env`

```bash
cp .env.example .env
```

Edit `.env` with production values:

```bash
PORT=3000
FRONTEND_URL=https://budgeteer.example.com
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
VITE_API_URL=https://budgeteer.example.com
```

### 5. Build frontend

```bash
bun install
bun run build
```

### 6. Configure Caddy

```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
```

Edit `/etc/caddy/Caddyfile` — replace `budgeteer.example.com` with your domain.

```bash
sudo systemctl reload caddy
```

### 7. Configure systemd service

```bash
sudo cp budgeteer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now budgeteer
```

### 8. Verify

```bash
# Check API is running
sudo systemctl status budgeteer

# Check Caddy is serving
curl -I https://budgeteer.example.com/api/health
```

### Deploy updates

After pushing to main:

```bash
./deploy.sh
```

This pulls latest code, rebuilds the frontend, and restarts the API.

## Project Structure

```
budgeteer/
├── apps/
│   ├── api/              # Elysia backend
│   │   ├── src/
│   │   │   ├── routes/   # API route handlers
│   │   │   ├── db/       # Schema, migrations
│   │   │   ├── auth.ts   # better-auth config
│   │   │   └── index.ts  # Server entry
│   │   └── data/         # SQLite database (gitignored)
│   └── web/              # React frontend
│       ├── src/
│       │   ├── routes/   # TanStack Router pages
│       │   ├── components/
│       │   └── lib/      # API client, utils
│       └── dist/         # Build output (gitignored)
├── packages/
│   └── api-types/        # End-to-end type safety
├── Caddyfile             # Caddy reverse proxy config
├── budgeteer.service     # systemd service
└── deploy.sh             # Deploy script
```
