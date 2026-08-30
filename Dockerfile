FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy all package files
COPY pnpm-workspace.yaml package.json ./
COPY fleet/api-gateway/package.json ./fleet/api-gateway/
COPY fleet/orders/package.json ./fleet/orders/
COPY fleet/auth/package.json ./fleet/auth/
COPY agents/tools/fleet-control/package.json ./agents/tools/fleet-control/
COPY agents/tools/deploy-history/package.json ./agents/tools/deploy-history/

# Install dependencies
RUN pnpm install

# Copy source files
COPY fleet/ ./fleet/
COPY agents/ ./agents/

# Build TypeScript
RUN cd fleet/api-gateway && pnpm build && \
    cd ../orders && pnpm build && \
    cd ../auth && pnpm build && \
    cd ../../agents/tools/fleet-control && pnpm build && \
    cd ../deploy-history && pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g concurrently

COPY --from=builder /app /app

ENV PORT=5000
ENV API_GATEWAY_URL=http://localhost:4001
ENV ORDERS_URL=http://localhost:4002
ENV AUTH_URL=http://localhost:4003

EXPOSE 5000 4001 4002 4003 5001

CMD ["concurrently", \
     "node fleet/api-gateway/dist/index.js", \
     "node fleet/orders/dist/index.js", \
     "node fleet/auth/dist/index.js", \
     "node agents/tools/deploy-history/dist/index.js", \
     "node agents/tools/fleet-control/dist/index.js"]
