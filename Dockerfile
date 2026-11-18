# ==============================================================================
# TATITO FINANCIAL SERVICES — PRODUCTION DOCKER IMAGE
# ==============================================================================
FROM node:20-alpine

WORKDIR /app

# Install production and build dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build frontend Vite bundle & Vercel/Node server bundle
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
