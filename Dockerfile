# Use Node.js Alpine image for building
FROM node:24.11.1-alpine AS builder

# Install the pinned package manager from package.json.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN apk update && \
    apk add python3 make g++ && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE $PORT

# Start the application
CMD ["pnpm", "start"]

# # Production stage
# FROM node:24.11.1-alpine AS runner

# # Install pnpm
# RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# # Set working directory
# WORKDIR /app

# # Copy built application from builder stage
# COPY --from=builder /app/.next /app/.next
# COPY --from=builder /app/public /app/public
# COPY --from=builder /app/package.json /app
# COPY --from=builder /app/node_modules /app/node_modules

# # Set environment variables
# ENV NODE_ENV=production
# ENV PORT=3000

# # Expose port
# EXPOSE $PORT

# # Start the application
# CMD ["pnpm", "start"]
