# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM nginx:stable-alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx runs on port 80 by default
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
