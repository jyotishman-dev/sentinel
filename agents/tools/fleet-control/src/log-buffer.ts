export interface LogEntry {
  timestamp: string;
  service: string;
  level: "info" | "warn" | "error";
  message: string;
}

const buffer: LogEntry[] = [];
const MAX_ENTRIES = 200;

export function pushLog(entry: Omit<LogEntry, "timestamp">): void {
  buffer.push({ ...entry, timestamp: new Date().toISOString() });
  if (buffer.length > MAX_ENTRIES) {
    buffer.shift();
  }
}

export function getRecentLogs(serviceName?: string, limit = 20): LogEntry[] {
  const filtered = serviceName ? buffer.filter((l) => l.service === serviceName) : buffer;
  return filtered.slice(-limit);
}