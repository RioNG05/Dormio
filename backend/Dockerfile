FROM node:22-alpine

# Install libc6-compat for Prisma engine on Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

# Copy dependency specifications first for Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma.config.ts ./
COPY prisma/ prisma/

# Install all dependencies (including devDependencies like @nestjs/cli, ts-node)
RUN pnpm install

# Generate Prisma client
RUN pnpm db:generate

EXPOSE 3001

# Deploy any pending migrations, ensure prisma client is current, then run NestJS with hot reload
CMD ["sh", "-c", "npx prisma migrate deploy && pnpm db:generate && pnpm start:dev"]

