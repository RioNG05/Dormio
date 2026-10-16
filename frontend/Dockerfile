FROM node:22-alpine

# Install libc6-compat for Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

# Copy dependency specifications first for Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including devDependencies like Tailwind, TypeScript)
RUN pnpm install

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start Next.js development server with hot reload
CMD ["pnpm", "dev"]

