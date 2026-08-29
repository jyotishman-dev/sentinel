export interface Deploy {
  service: string;
  sha: string;
  author: string;
  message: string;
  deployed_at: string; // ISO timestamp
}

const SERVICES = ["api-gateway", "orders", "auth"];

const MESSAGES: Record<string, string[]> = {
  "api-gateway": [
    "bump request timeout from 2s to 5s",
    "add retry logic for upstream calls",
    "refactor rate limiter middleware",
  ],
  orders: [
    "fix rounding error in order totals",
    "add idempotency key support",
    "increase connection pool size",
  ],
  auth: [
    "rotate default token TTL to 15m",
    "patch session cookie flags",
    "swap bcrypt rounds config",
  ],
};

// Generated once at process start so "recent" deploys stay recent relative to
// when the server booted, and each restart gives you a fresh-looking history
// without needing a real database.
function generateHistory(): Deploy[] {
  const now = Date.now();
  const history: Deploy[] = [];

  for (const service of SERVICES) {
    const messages = MESSAGES[service];
    messages.forEach((message, i) => {
      // Most recent deploy per service lands 2-20 minutes ago, older ones further back.
      const minutesAgo = 2 + i * 15 + Math.floor(Math.random() * 5);
      history.push({
        service,
        sha: Math.random().toString(16).slice(2, 9),
        author: "jyotishman-dev",
        message,
        deployed_at: new Date(now - minutesAgo * 60_000).toISOString(),
      });
    });
  }

  return history.sort(
    (a, b) => new Date(b.deployed_at).getTime() - new Date(a.deployed_at).getTime()
  );
}

const HISTORY = generateHistory();

export function getRecentDeploys(serviceName?: string, limit = 10): Deploy[] {
  const filtered = serviceName ? HISTORY.filter((d) => d.service === serviceName) : HISTORY;
  return filtered.slice(0, limit);
}