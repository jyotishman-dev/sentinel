import fetch from "node-fetch"

const services = {
  'api-gateway': process.env.API_GATEWAY_URL || 'http://localhost:4001',
  'orders': process.env.ORDERS_URL || 'http://localhost:4002',
  'auth': process.env.AUTH_URL || 'http://localhost:4003',
};

const mode = process.argv[2] || 'random';

async function trigger(serviceName, chaosType) {
  const base = services[serviceName];
  const res = await fetch(`${base}/chaos/${chaosType}`, { method: 'POST' });
  const data = await res.json();
  console.log(`Triggered ${chaosType} on ${serviceName}:`, data);
}

async function run() {
  const names = Object.keys(services);
  const target = names[Math.floor(Math.random() * names.length)];
  const type = mode === 'random'
    ? ['kill', 'latency'][Math.floor(Math.random() * 2)]
    : mode;
  await trigger(target, type);
}

run();