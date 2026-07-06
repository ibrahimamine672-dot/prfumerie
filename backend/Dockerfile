# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --only=production

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set ownership to non-root user
RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
