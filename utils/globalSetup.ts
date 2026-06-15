import configJson from './configuration.json';

const API_URL = process.env.AUTOMATION_API_URL || 'http://localhost:3050';
const API_TOKEN = process.env.AUTOMATION_API_TOKEN;

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'Cypress/15.13.1',
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  };
}

export default async function globalSetup() {
  const res = await fetch(`${API_URL}/api/init`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      runId: Number(configJson.testRunId),
      project: configJson.testRailProject,
      framework: 'playwright',
      debug: false,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Dex Reporter init failed (${res.status}): ${JSON.stringify(error)}`);
  }

  const data = await res.json() as { runId: number; mappingsLoaded: number };
  console.log(`Dex Reporter: Session initialized for run #${data.runId} - ${data.mappingsLoaded} mappings loaded`);
}
