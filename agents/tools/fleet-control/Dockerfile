FROM node:22-slim

RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

CMD ["node", "dist/index.js"]

