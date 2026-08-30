FROM node:22-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace and root package files
COPY pnpm-workspace.yaml package.json .npmrc ./

# Copy all packages
COPY fleet/ ./fleet/
COPY agents/ ./agents/
COPY chaos-engine/ ./chaos-engine/

# Install all dependencies across the monorepo workspace
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Install global runner tools
RUN npm install -g concurrently tsx

ENV NODE_ENV=production
ENV API_GATEWAY_URL=http://localhost:4001
ENV ORDERS_URL=http://localhost:4002
ENV AUTH_URL=http://localhost:4003

EXPOSE 5000 4001 4002 4003 5001

CMD ["sh", "-c", "concurrently --kill-others-on-fail \
     \"PORT=4001 tsx fleet/api-gateway/src/server.ts\" \
     \"PORT=4002 tsx fleet/orders/src/server.ts\" \
     \"PORT=4003 tsx fleet/auth/src/server.ts\" \
     \"PORT=5001 tsx agents/tools/deploy-history/src/index.ts\" \
     \"PORT=${PORT:-5000} tsx agents/tools/fleet-control/src/index.ts\""]
