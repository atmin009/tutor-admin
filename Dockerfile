# Admin Dockerfile - Multi-stage build with Vite
FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
RUN npm ci || npm install

# Build stage
FROM base AS builder
WORKDIR /app

# Build argument for API URL
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production stage - serve static files
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install serve for static file serving
RUN npm install -g serve@14.2.1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Serve the built files
CMD ["serve", "-s", "dist", "-l", "3000"]

