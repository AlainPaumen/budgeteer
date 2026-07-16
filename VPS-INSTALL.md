# VPS Installation Guide

Step-by-step guide for deploying Budgeteer to a VPS with Caddy.

## Prerequisites

- Ubuntu 22.04+ VPS
- Domain pointed to your VPS IP (A record)
- SSH access as root or sudo user

## 1. Update system

```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version  # verify
```

## 3. Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

## 4. Clone the repository

```bash
sudo mkdir -p /opt/budgeteer
sudo chown $USER /opt/budgeteer
git clone <your-repo-url> /opt/budgeteer
cd /opt/budgeteer
```

## 5. Create `.env`

```bash
cp .env.example .env
```

Edit with your values:

```bash
nano .env
```

Required:

```
PORT=3000
FRONTEND_URL=https://your-domain.com
BETTER_AUTH_SECRET=<run: openssl rand -base64 32>
VITE_API_URL=https://your-domain.com
```

## 6. Install dependencies and build

```bash
bun install
bun run build
```

## 7. Configure Caddy

```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
```

Edit `/etc/caddy/Caddyfile` — replace `budgeteer.example.com` with your domain:

```bash
sudo nano /etc/caddy/Caddyfile
```

```bash
sudo systemctl reload caddy
```

## 8. Configure and start the API service

```bash
sudo cp budgeteer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now budgeteer
```

## 9. Open firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## 10. Verify

```bash
# API running?
sudo systemctl status budgeteer

# Caddy serving?
curl -I https://your-domain.com/api/health

# Check logs?
sudo journalctl -u budgeteer -f
sudo journalctl -u caddy -f
```

## Updating

After pushing to main:

```bash
cd /opt/budgeteer
./deploy.sh
```

## Troubleshooting

**Caddy not getting TLS certificate**
- Ensure DNS A record points to your VPS IP
- Wait a few minutes, then: `sudo systemctl reload caddy`

**API won't start**
- Check logs: `sudo journalctl -u budgeteer -n 50`
- Verify `.env` exists and has valid `BETTER_AUTH_SECRET`
- Check SQLite data dir is writable: `ls -la /opt/budgeteer/apps/api/data/`

**CORS errors in browser**
- Ensure `FRONTEND_URL` in `.env` matches your exact domain (including `https://`)
- Check `ALLOWED_ORIGINS` includes your domain
