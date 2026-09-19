# Multi-stage production Dockerfile for ElderVoice Kiosk

# Stage 1: Build client and bundle server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source code and build client + backend bundles
COPY . .
RUN npm run build

# Stage 2: Production runtime environment
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled bundle and static assets from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
