# ── Build stage ────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Production stage ───────────────────────────────────────────────
FROM node:20-slim AS production

# Install Google Chrome (stable) — required for Remotion rendering.
# This is the recommended approach for Docker deployments.
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y \
    google-chrome-stable \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy production deps and built output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Tell browser.ts exactly where Chrome lives — no detection needed
ENV CHROME_EXECUTABLE=/usr/bin/google-chrome-stable
ENV MCP_MODE=http
ENV PORT=3000

# Remotion render outputs go here — mount a volume to persist them
RUN mkdir -p /renders
ENV RENDER_OUTPUT_DIR=/renders

EXPOSE 3000

# Health check for Railway / Fly.io / Docker Compose
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
