# Deploying Crackit (free: Oracle Cloud Always Free VM)

One small server runs everything with Docker Compose (`docker-compose.prod.yml`):

```
visitor ──HTTPS──► web (Caddy: certificate, React app, /api proxy) ──► backend (FastAPI, Kokoro voice)
                                                                         ├──► postgres  (no public port)
                                                                         └──► qdrant    (no public port)
                   backup: pg_dump every 24 h into ./backups, newest 7 kept
```

Cost: **₹0**. The VM is Oracle's Always Free Ampere A1 (ARM64, up to 4 cores and 24 GB RAM), the
domain can be a free DuckDNS subdomain, HTTPS is a free Let's Encrypt certificate that Caddy
gets and renews by itself, and the AI runs on the Groq free tier (plus each user's own key).

Contents: [1. Create the VM](#1-create-the-vm) · [2. Open ports 80 and 443](#2-open-ports-80-and-443) ·
[3. Install Docker](#3-install-docker) · [4. Get the code and the voice model](#4-get-the-code-and-the-voice-model) ·
[5. Domain](#5-domain) · [6. Configure .env](#6-configure-env) · [7. Start](#7-start) ·
[8. Monitoring](#8-monitoring) · [9. Backups and restore](#9-backups-and-restore) ·
[10. Updating](#10-updating) · [Troubleshooting](#troubleshooting)

---

## 1. Create the VM

1. Sign up at <https://www.oracle.com/cloud/free/> (a card is asked for identity checks; Always
   Free resources are not charged).
2. **Compute → Instances → Create instance**:
   - **Image:** Canonical Ubuntu 24.04 (pick the *aarch64* build; it is the default for Ampere).
   - **Shape:** *Change shape* → **Ampere** → `VM.Standard.A1.Flex`, **4 OCPUs, 24 GB memory**
     (the whole Always Free allowance).
   - **Networking:** keep the default new VCN and *Assign a public IPv4 address*.
   - **SSH keys:** upload your public key (or download the generated pair and keep it safe).
   - **Boot volume:** 100 GB is plenty (Always Free includes 200 GB of block storage in total).
3. "Out of capacity" for A1 is common in busy regions: try another availability domain, or
   retry later. It is a capacity problem, not a setup mistake.
4. Note the instance's **public IP**.

> **Idle reclaim:** Oracle may reclaim Always Free instances that stay almost idle for 7 days
> (very low CPU, network and memory use). A site with real users is rarely idle, but if you
> are worried, upgrading the account to *Pay As You Go* keeps the same free allowance and
> removes the reclaim rule. Set a budget alert at ₹1 so nothing can cost money unnoticed.

SSH in: `ssh ubuntu@<public-ip>`.

## 2. Open ports 80 and 443

Two firewalls must allow web traffic.

**a) Oracle's network (security list).** Networking → Virtual cloud networks → your VCN →
Security → *Default Security List* → **Add ingress rules**:

| Source CIDR | Protocol | Destination port | Why |
|---|---|---|---|
| `0.0.0.0/0` | TCP | 80 | Let's Encrypt check + redirect to HTTPS |
| `0.0.0.0/0` | TCP | 443 | the site |
| `0.0.0.0/0` | UDP | 443 | HTTP/3 (optional) |

Port 22 (SSH) is already open. Do **not** open 5432, 6333 or 8001: the database, Qdrant and the
API are reachable only inside Docker.

**b) The VM's own iptables.** Oracle's Ubuntu images block everything except SSH:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 3. Install Docker

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y unattended-upgrades git     # automatic security updates for the OS
curl -fsSL https://get.docker.com | sudo sh          # Docker Engine + Compose plugin (arm64)
sudo usermod -aG docker $USER                        # run docker without sudo
exit                                                 # log out and back in for the group to apply
```

Check: `docker compose version`.

## 4. Get the code and the voice model

**Code.** Push the repository to a *private* GitHub repo from your laptop, then on the server:

```bash
git clone https://github.com/<you>/<repo>.git crackit && cd crackit
```

(Without GitHub: `scp -r` the project folder, skipping `node_modules`, `.venv` and `data`.)

**Voice model** (git-ignored, ~400 MB). Copy the two Kokoro files you already use locally:

```bash
# on your laptop (PowerShell), from the repo root
scp data/models/kokoro/kokoro-v1.0.onnx data/models/kokoro/voices-v1.0.bin ubuntu@<public-ip>:~/crackit/data/models/kokoro/
```

Create the folder first on the server (`mkdir -p ~/crackit/data/models/kokoro`). The FastEmbed
embedding model downloads itself into `data/models` on first start.

**Permissions.** The API runs as an unprivileged user (uid 10001) and writes uploads and
model caches into `data/`:

```bash
sudo chown -R 10001:10001 ~/crackit/data
```

## 5. Domain

Any domain works; a free one: <https://www.duckdns.org> → sign in → create e.g.
`crackit-yourname` → set its IP to the VM's public IP. Your site is then
`crackit-yourname.duckdns.org`. (With your own domain: an `A` record to the public IP.)

Check before starting: `ping crackit-yourname.duckdns.org` should show the VM's IP.

## 6. Configure .env

```bash
cp .env.example .env
nano .env
```

Set (the API refuses to start in production with development defaults):

| Variable | Value |
|---|---|
| `APP_ENV` | `production` |
| `SECRET_KEY` | output of `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | output of `openssl rand -hex 24` |
| `CORS_ORIGINS` | `https://crackit-yourname.duckdns.org` |
| `SITE_ADDRESS` | `crackit-yourname.duckdns.org` (no `https://`) |
| `LANGSMITH_TRACING` | `false` (production forces it off anyway: traces would contain user data) |

There is no server Groq key: every user adds their own free key in Settings (bring-your-own-key
only). The AI features answer 428 "add your key" until they do.

Leave `POSTGRES_HOST`, `POSTGRES_PORT` and `QDRANT_URL` as they are: the compose file points the
API at the containers. `chmod 600 .env` so only you can read it.

## 7. Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f backend web
```

The first build takes a few minutes. Wait for `Application startup complete` (backend) and
`certificate obtained successfully` (web), then open `https://<your domain>`.

`docker compose -f docker-compose.prod.yml ps` should show every service `running`, and the
backend `healthy` after its warm-up (~1-3 min: it indexes the question bank and loads models).

Tip: `alias dcp='docker compose -f docker-compose.prod.yml'` in `~/.bashrc` saves typing.

## 8. Monitoring

- **Self-healing:** every container has `restart: unless-stopped`, so crashes and VM reboots
  bring it back. The backend's healthcheck calls `/api/v1/health` (Postgres + Qdrant).
- **Uptime alerts (free):** <https://uptimerobot.com> → *New monitor* → type **Keyword**,
  URL `https://<your domain>/api/v1/health`, keyword `"status":"ok"` (alert when it does *not*
  exist), interval 5 min, alert contact = your email. A keyword check catches both "site down"
  and "site up but database unreachable" (the endpoint then says `degraded`).
- **Logs:** `dcp logs --tail 200 backend`. Docker keeps at most 5 × 10 MB per container.
- **Disk:** `df -h /` now and then; backups and Docker images are the growing parts
  (`docker image prune -f` after updates).

## 9. Backups and restore

The `backup` container writes `./backups/crackit-<UTC time>.dump` once at start and then every
24 hours, keeping the newest 7. Check: `ls -lh backups/` and `dcp logs backup`.

They contain everything in Postgres: accounts, interviews and reports, parsed resumes, prep
stars and sets, and paused-interview checkpoints. Not included: uploaded resume files
(`data/uploads`) and Qdrant (the question bank is rebuilt at every start; resume vectors are
rebuilt by re-parsing a resume).

**Off-site copy.** Backups on the same VM don't survive losing the VM. Simplest: pull them to
your laptop regularly:

```powershell
scp -r ubuntu@<public-ip>:~/crackit/backups ./crackit-backups
```

(Automated alternative: Oracle Object Storage, 20 GB free, with `rclone` in a daily cron job.)

**Restore** (replaces the current database with a dump):

```bash
dcp stop backend backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore --clean --if-exists -U mockinterview -d mockinterview < backups/crackit-<time>.dump
dcp start backend backup
```

Try a restore once on a copy (for example the local test stack) so you know it works before
you need it.

## 10. Updating

```bash
cd ~/crackit
git pull
docker compose -f docker-compose.prod.yml up -d --build   # migrations run automatically on start
docker image prune -f
```

The backup container takes a fresh dump each time it restarts. To roll back code:
`git checkout <previous commit>` and run the same `up -d --build`. A migration that changed
the schema may need the database restored from the dump taken before the update.

CI (`.github/workflows/ci.yml`) runs the tests, lint and both image builds on every push, so
check it is green before pulling on the server.

## Testing the production stack on a laptop

Docker Desktop can run the same stack beside the development one (different ports):

1. Make a separate env file outside the repo (e.g. `C:\temp\prodtest.env`) with:
   `APP_ENV=production`, a random `SECRET_KEY` and `POSTGRES_PASSWORD`,
   `CORS_ORIGINS=http://127.0.0.1:8088`, `SITE_ADDRESS=:80`, `HTTP_PORT=8088`,
   `HTTPS_PORT=8443`, and `ENV_FILE=C:/temp/prodtest.env` (its own path, forward slashes).
   Use `127.0.0.1`, not `localhost`: production mode refuses `localhost` origins on purpose.
2. Start it, then open <http://127.0.0.1:8088>:

```powershell
docker compose -f docker-compose.prod.yml --env-file C:/temp/prodtest.env -p crackit-test up -d --build
```

3. Stop and delete it (containers and its database), and remove the test dumps in `backups\`:

```powershell
docker compose -f docker-compose.prod.yml --env-file C:/temp/prodtest.env -p crackit-test down -v
```

It shares `data\` (uploads, models) with development. Plain HTTP works only on
127.0.0.1/localhost: browsers allow the microphone and the encrypted key store (WebCrypto)
only on HTTPS or loopback, which is one more reason the real site must be HTTPS.

What was verified this way (Nov 2026, Docker Desktop on the dev laptop): fresh database
migrated at start; register → prep set → star → interview start → voice chunk → answer →
end → report through Caddy; security headers and client-side routes; the API sees the
visitor's IP, not Caddy's, and a forged `X-Forwarded-For` is ignored; `X-Groq-Key` never
appears in Caddy's logs; dump, rotation (7 kept) and restore. Voice in Docker on that laptop
measured 1.4 s of work per second of audio (0.8 natively), so check `X-Gen-Per-Audio` on the
VM: above ~1 the browser waits longer before speaking (it buffers to avoid gaps).

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Browser can't connect at all | Ports: check the security list rules **and** the iptables commands (step 2). `curl -I http://localhost` on the VM tells you which side blocks. |
| `web` logs: certificate errors | DNS doesn't point at the VM yet, or port 80 is blocked. Fix it and `dcp restart web`. |
| Backend restarts with "Unsafe production settings" | `.env` still has a development value; the message names it. |
| Backend: `PermissionError` under `/srv/data` | Run `sudo chown -R 10001:10001 data` (step 4). |
| Interviewer uses the browser voice | Kokoro files missing or misnamed in `data/models/kokoro/` (`dcp logs backend \| grep -i kokoro`). |
| "Too many requests" for everyone at once | The per-IP limits see one IP: the API must run behind Caddy with `--proxy-headers` (it does in the image); don't publish port 8001 directly. |
| Out of disk | `docker system prune`, and check `backups/`. |
