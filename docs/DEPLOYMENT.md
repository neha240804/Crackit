# Deploying Crackit (free: Oracle Cloud Always Free VM)

One small server runs everything with Docker Compose (`docker-compose.prod.yml`):

```
visitor ──HTTPS──► web (Caddy: certificate, React app, /api proxy) ──► backend (FastAPI + LangGraph)  
                                                                         ├──► postgres  (no public port)
                                                                         └──► qdrant    (no public port)
                   backup: database + uploaded resumes every 24 h into ./backups, newest 7 kept
```

Cost: **₹0**. The VM is Oracle's Always Free Ampere A1 (ARM64, up to 4 cores and 24 GB RAM), the
domain can be a free DuckDNS subdomain, HTTPS is a free Let's Encrypt certificate that Caddy
gets and renews by itself, and the AI runs on the Groq free tier (plus each user's own key).

Contents: [1. Create the VM](#1-create-the-vm) · [2. Open ports 80 and 443](#2-open-ports-80-and-443) ·
[3. Install Docker](#3-install-docker) · [4. Get the code](#4-get-the-code) ·
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

## 4. Get the code

**Code.** The repository is on GitHub (private). On the server:

```bash
git clone https://github.com/<you>/<repo>.git crackit && cd crackit
```

`main` is what you deploy. (A private repo asks for your GitHub username and a personal
access token with `repo` read access as the password; or add the server's SSH key to GitHub.)

**Data folders and permissions.** The API runs as an unprivileged user (uid 10001) and writes
uploads and model caches into `data/`; the backup container reads `data/uploads`. Create them
before the first start (otherwise Docker creates them owned by root and uploads fail):

```bash
mkdir -p data/uploads data/exports data/models backups
sudo chown -R 10001:10001 data
```

**No voice model is needed.** The interviewer speaks with each student's own browser voice
(`TTS_ENGINE=browser`, the default). Only if you switch to `TTS_ENGINE=kokoro` do you copy
the two Kokoro files (~400 MB) into `data/models/kokoro/` (see *Capacity* for why that's not
the default). The FastEmbed embedding model downloads itself into `data/models` on first start.

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
| `LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, `TRACE_IN_PRODUCTION` | optional: set `LANGSMITH_TRACING=true`, your LangSmith key and `TRACE_IN_PRODUCTION=true` to see every AI step's latency, tokens and errors in LangSmith. Production sends **timings only** (no answers, resumes, reports or prompts; enforced in code). Leave `TRACE_IN_PRODUCTION` unset to keep tracing off |
| `APP_URL` | `https://crackit-yourname.duckdns.org` (used in password-reset links) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | your email provider's SMTP details (see *Password-reset email* below) |
| `CONTACT_EMAIL` | the address shown on `/privacy` for questions about data |
| `SENTRY_DSN` | optional: error alerts (see *Monitoring*) |
| `ADMIN_EMAILS` | your own sign-up email: that account gets the **Quality** page (`/admin/quality`, AI quality of real interviews). Comma-separated for more than one |
| `ONLINE_EVAL_GROQ_KEY` | optional: **your own** Groq key for the online evaluation's AI judge (see *Monitoring*). Never used for students' features |

**Password-reset email.** Any provider with SMTP works; most have a free tier big enough for
this (for example Brevo, Mailjet or Resend). Create an account, verify the sending domain or
address, and copy its SMTP host, port (587), user and password into `.env`, with `MAIL_FROM`
like `Crackit <no-reply@your-domain>`. Without it, "Forgot password?" answers 503 and the
backend logs a warning at every start. Test it once: request a reset for your own account.

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
- **Uptime alerts (free):** <https://uptimerobot.com> (or Better Stack, Healthchecks) → *New
  monitor* → type **HTTP(s)**, URL `https://<your domain>/api/v1/health`, interval 5 min, alert
  contact = your email. The endpoint answers **503** when Postgres or Qdrant is unreachable
  (it used to answer 200 with `degraded`, which a plain HTTP monitor would miss), so it catches
  both "site down" and "site up but broken". Keyword `"status":"ok"` works as well.
- **Error alerts (optional, free tier):** create a project at <https://sentry.io> (platform
  Python / FastAPI), copy its DSN into `SENTRY_DSN`, restart. Unhandled server errors (a crash
  in an interview, a failing report) then arrive by email. Privacy: `core/monitoring.py` sends
  only the error and its stack trace: no request bodies, headers (no Groq keys), local variables
  or user data. The privacy notice says so; keep them in step.
- **AI quality (online evaluation):** every finished interview is checked in code (coaching
  rules, repeats, report completeness, report vs interviewer agreement, reply time); with
  `ONLINE_EVAL_GROQ_KEY` set, a quarter of them (max 25 a day) are also read by an AI judge on
  your key. See the results on the **Quality** page in the app (top bar, only for the accounts in
  `ADMIN_EMAILS`), or in a terminal:
  `dcp exec backend python -m app.quality.summary --days 7` (exit code 1 = a check is below
  target). Details and what to do with a failing check: `docs/EVALS.md`, *Online evaluation*.
- **Logs:** `dcp logs --tail 200 backend`. Docker keeps at most 5 × 10 MB per container.
- **Disk:** `df -h /` now and then; backups and Docker images are the growing parts
  (`docker image prune -f` after updates).

## 9. Backups and restore

The `backup` container writes two files once at start and then every 24 hours, keeping the
newest 7 of each:

- `./backups/crackit-<UTC time>.dump`: everything in Postgres: accounts, interviews and
  reports, parsed resumes, prep stars and sets, and paused-interview checkpoints.
- `./backups/crackit-<UTC time>-uploads.tgz`: the uploaded resume files (`data/uploads`).

Check: `ls -lh backups/` and `dcp logs backup`. Not included: Qdrant (the question bank is
rebuilt at every start; resume vectors are rebuilt by re-parsing a resume).

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
sudo tar -xzf backups/crackit-<time>-uploads.tgz -C data/uploads
sudo chown -R 10001:10001 data/uploads
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

## Capacity: the interviewer's voice is the limit

Kokoro runs on the server CPU and generates one chunk at a time for everyone (`tts._lock`).
`backend/scripts/load_test_voice.py` simulates N interviews at once with the real voice code
(each turn: a 35-45 word interviewer line, then a 20-35 s answer) and measures the **start
delay**: how long the interviewer must stay silent before the line can play without gaps. The
browser waits at most 3 s before it starts speaking anyway, so more than 3 s means audible
gaps between sentences. Measured Nov 21, 2026, in the production image on the dev laptop:

| Simultaneous interviews | 12 cores: median / worst 5% | 4 cores: median / worst 5% |
|---|---|---|
| 1 | 2.2 s / 2.5 s | 6.0-7.3 s / 7.2-7.7 s |
| 2 | 3.1 s / 5.4 s | 7.6-11.8 s / 10-16 s |
| 4 | 5.1 s / 8.6 s | 13-17 s / 22-23 s |
| 6 | 12.7 s / 21.8 s | 19.4 s / 33 s |
| 8 | 26.6 s / 46.8 s | - |

- On 12 fast cores, only **one** interview at a time stays under 3 s.
- On 4 cores (the size of the Always Free VM), even one interview waits ~6 s, so voices
  will have gaps. The 4-core runs used Docker CPU limits on a 12-core laptop (onnxruntime
  still started 12 threads), so a real 4-core ARM VM may differ: run the script there first.
- Letting 2 generations run at once (`--parallel 2`) made it worse (1.5 s of work per second
  of audio instead of 1.0): the cores are already busy with one.

Run on the server (from the repo root, with the stack up):

```bash
docker cp backend/scripts/load_test_voice.py crackit-backend-1:/tmp/
docker exec crackit-backend-1 python /tmp/load_test_voice.py --interviews 1 2 4
```

Conclusion: server-side voice does not scale to many simultaneous users on this hardware.

**What Crackit does about it (Nov 2026):** the interviewer's voice is generated by Groq's
Orpheus model on each user's own key (`TTS_ENGINE=groq`, tried as the default before the browser voice), one request per line:
a 10-14 s line took ~2-2.5 s, three at once 3.2 s, and none of it uses the server CPU (no longer the default: see the decision below). Kokoro
stays as the fallback for an interview whose user hasn't accepted the Orpheus terms on their
Groq account or has used up the day's voice quota, so the load test above still describes
how many of THOSE interviews the server can voice at once. `TTS_ENGINE=kokoro` switches Groq
voice off.

**Correction (Nov 21, 2026): Orpheus's free tier is far smaller than first measured.** The
response headers show 100 requests/day and 1,200 characters/minute, but there is also a cap of
**3,600 characters per day** per Groq account that only appears when it is hit (a live
5-minute interview switched to the Kokoro voice after 4-5 questions). One 15-minute interview
needs ~4,000 characters, so the free Groq voice cannot carry even one.

**In-browser Kokoro prototype (a `/voice-lab` page, Nov 21, 2026; removed after the test)**, same lines and measure as the
server load test, Chromium in the dev laptop's browser pane (hidden, which may slow it):

| Engine | Model download | Work per second of audio | Wait before speaking |
|---|---|---|---|
| CPU (WebAssembly, 1 thread: page not cross-origin isolated) | ~90 MB (q8), 39 s first time | ~3.0 | ~26 s |
| GPU (WebGPU, fp32) | 326 MB, 60 s first time | ~0.9-1.0 | 4.0-5.8 s |
| CPU, multithreaded (COOP/COEP headers) | - | - | did not finish starting in ~3 min |

So on this laptop even the GPU path waits longer than the 3 s target, CPU-only devices are far
too slow, and the first visit downloads 90-330 MB.

**Decision (Nov 21, 2026): the interviewer speaks with the student's own browser voice**
(`TTS_ENGINE=browser`, the default). It is instant and unlimited, needs no download and no
server work, and never changes mid-interview, so every student can do 3 x 15-minute interviews
a day. The server no longer generates speech or loads Kokoro, so this capacity section no
longer limits how many people can interview at once. `TTS_ENGINE=kokoro` / `groq` bring the
server voices back (with the limits above). The in-browser prototype was removed after the
test (its kokoro-js dependency pulls `onnxruntime-node`, whose install script broke the image
build); to try it again on other devices, rebuild it from these notes.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Browser can't connect at all | Ports: check the security list rules **and** the iptables commands (step 2). `curl -I http://localhost` on the VM tells you which side blocks. |
| `web` logs: certificate errors | DNS doesn't point at the VM yet, or port 80 is blocked. Fix it and `dcp restart web`. |
| Backend restarts with "Unsafe production settings" | `.env` still has a development value; the message names it. |
| Backend: `PermissionError` under `/srv/data` | Run `sudo chown -R 10001:10001 data` (step 4). |
| Interviewer's voice sounds robotic | It is the student's browser voice (`TTS_ENGINE=browser`). Edge's "Natural" voices sound best; Chrome on Windows has fewer good voices. |
| Microphone doesn't work | The site must be opened over HTTPS (browsers block the mic on plain HTTP). |
| "Too many requests" for everyone at once | The per-IP limits see one IP: the API must run behind Caddy with `--proxy-headers` (it does in the image); don't publish port 8001 directly. |
| Out of disk | `docker system prune`, and check `backups/`. |
