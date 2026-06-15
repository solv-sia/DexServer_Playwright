import config from './config';

export interface MachineInfo {
  MachineId: number;
  CustomerId: number;
  Name: string;
  ActivationKey: string | null;
  SerialNumber: string;
  MessageKey: string;
}

export interface CreatedPlayer {
  activationKey: string | null;
  serialNumber: string;
  machineId: number;
  machineName: string;
  customerId: number;
  messageKey: string;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Cypress/15.13.1',
  };
  if (config.automationApiToken) {
    headers['Authorization'] = `Bearer ${config.automationApiToken}`;
  }
  return headers;
}

// Crea un player headless vía doHandshake y resuelve los datos completos con getMachine.
// activationKey puede ser null para devices virtuales (no usan el diálogo de activación UI).
export async function createPlayer(tenantActivationKey: string, name?: string): Promise<CreatedPlayer> {
  const maxAttempts = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${config.automationApiUrl}/api/player`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ baseUrl: config.baseUrl, activationKey: tenantActivationKey, ...(name ? { name } : {}) }),
      });
      if (!res.ok) {
        throw new Error(`createPlayer failed: ${res.status} ${await res.text()}`);
      }

      const data = await res.json() as Record<string, unknown>;

      const machineId = data['MachineId'] as number | null;
      const machineName = data['MachineName'] as string | null;
      const serialNumber = (data['SerialNumber'] as string | null)
        ?? machineName?.replace('playerheadless ', '').trim()
        ?? null;

      if (!machineId || !serialNumber || !machineName) {
        throw new Error(`createPlayer: respuesta inesperada del handshake: ${JSON.stringify(data)}`);
      }

      const machine = await getMachine(serialNumber);
      return {
        activationKey: machine.ActivationKey,
        serialNumber: machine.SerialNumber,
        machineId,
        machineName: machine.Name,
        customerId: machine.CustomerId,
        messageKey: machine.MessageKey,
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxAttempts) {
        console.warn(`[createPlayer] attempt ${attempt}/${maxAttempts} failed: ${lastError.message} — retrying in 3s`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  throw lastError ?? new Error('createPlayer: all attempts failed');
}

export async function simulateDownloads(player: CreatedPlayer): Promise<void> {
  const res = await fetch(`${config.automationApiUrl}/api/player/simulate-downloads`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      baseUrl: config.baseUrl,
      customerId: player.customerId,
      messageKey: player.messageKey,
      machineId: player.machineId,
    }),
  });
  if (!res.ok) {
    throw new Error(`simulateDownloads failed: ${res.status} ${await res.text()}`);
  }
}

export interface ProofOfPlay {
  ProofOfPlayId: number;
  MachineId: number;
  MediaComponentName: string;
}

export async function getProofOfPlayEvents(machineId: string | number): Promise<ProofOfPlay[]> {
  const res = await fetch(
    `${config.automationApiUrl}/api/proof-of-play/${config.automationApiDbKey}/${machineId}`,
    { headers: buildHeaders() }
  );
  if (!res.ok) {
    throw new Error(`getProofOfPlayEvents failed: ${res.status} — machineId: ${machineId}`);
  }
  return res.json() as Promise<ProofOfPlay[]>;
}

export async function deletePlayer(machineId: number): Promise<void> {
  const res = await fetch(
    `${config.automationApiUrl}/api/machine/${config.automationApiDbKey}/${machineId}`,
    { method: 'DELETE', headers: buildHeaders() }
  );
  if (!res.ok) {
    console.warn(`deletePlayer: could not delete machineId ${machineId} — ${res.status}`);
  }
}

export async function getMachine(serialNumber: string): Promise<MachineInfo> {
  const res = await fetch(
    `${config.automationApiUrl}/api/machine/${config.automationApiDbKey}/${encodeURIComponent(serialNumber)}`,
    { headers: buildHeaders() }
  );
  if (!res.ok) {
    throw new Error(`getMachine failed: ${res.status} — serialNumber: ${serialNumber}`);
  }
  return res.json() as Promise<MachineInfo>;
}
