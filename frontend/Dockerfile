# Multi-stage build for smaller final image
FROM node:22-alpine as builder

WORKDIR /app

# Copy package files separately for better caching
COPY package*.json ./
COPY package-lock.json* ./

# Install dependencies (this layer caches well)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine as production

WORKDIR /app

# Install serve globally
RUN npm install -g serve && npm cache clean --force

# Copy only the built artifacts from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use non-root user for security
USER node

CMD ["serve", "-s", "dist"]
