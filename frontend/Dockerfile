# Crackit web: builds the React app, then serves it with Caddy, which is also the HTTPS
# reverse proxy for the API. Build from the REPO ROOT:
#   docker build -f frontend/Dockerfile -t crackit-web .
# Both base images are multi-arch (amd64 + arm64).

# ---- 1) build the static site ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Shown on the privacy page as the contact for data questions (optional; baked in at build).
ARG VITE_CONTACT_EMAIL=""
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
# tsc type-check + Vite bundle into /app/dist. The app calls the API with relative /api/...
# URLs, so the same bundle works on any domain.
RUN npm run build

# ---- 2) serve it -------------------------------------------------------------------------
FROM caddy:2.10-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv/www
# Caddy keeps its HTTPS certificates in /data (a named volume in docker-compose.prod.yml),
# so restarts don't re-request certificates and hit Let's Encrypt's rate limits.
