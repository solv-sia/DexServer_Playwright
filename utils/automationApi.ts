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
export async function createPlayer(tenantActivationKey: string, name?: string): Promise<CreatedPlayer> {
  return _createPlayerRequest({ activationKey: tenantActivationKey }, name);
}

// Crea un player headless en un tenant específico identificado por customerId.
// El API resuelve la activation key desde la BD usando el dbKey configurado.
export async function createPlayerInCustomer(customerId: number, name?: string): Promise<CreatedPlayer> {
  return _createPlayerRequest({ customerId, dbKey: config.automationApiDbKey }, name);
}

async function _createPlayerRequest(
  identity: { activationKey?: string; customerId?: number; dbKey?: string },
  name?: string,
): Promise<CreatedPlayer> {
  const maxAttempts = 5;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${config.automationApiUrl}/api/player`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ baseUrl: config.baseUrl, ...identity, ...(name ? { name } : {}) }),
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
        console.warn(`[createPlayer] attempt ${attempt}/${maxAttempts} failed: ${lastError.message} — retrying in 5s`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  throw new Error(`PRECONDICIÓN FALLIDA: No se pudo crear el player "${name ?? 'sin nombre'}" después de ${maxAttempts} intentos. Último error: ${lastError?.message ?? 'desconocido'}`);
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

// --- Dexaut QA heartbeat API -------------------------------------------------
// The direct DexFrontend `heartBeatSync` endpoint, when polled with an empty body,
// recomputes LatestVersion against a missing reported version and returns
// 0.0.0000.0000 even when the player has a "version to install" configured. The
// dexaut QA endpoint instead reads the player's stored HB state, so it surfaces the
// configured install version as LatestVersion. Requires a bearer token from login.

let dexautToken: string | null = null;

async function getDexautToken(): Promise<string> {
  if (dexautToken) return dexautToken;
  const res = await fetch(`${config.dexautUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'InDClient/1.0.0' },
    body: JSON.stringify({ user: config.userName, password: config.password }),
  });
  if (!res.ok) {
    throw new Error(`dexaut login failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json() as Record<string, unknown>;
  const token = data['token'] as string | undefined;
  if (!token) {
    throw new Error(`dexaut login: no token in response: ${JSON.stringify(data)}`);
  }
  dexautToken = token;
  return token;
}

// Returns the stored heartbeat payload for a machine (same shape as heartBeatSync).
export async function getHeartBeatByMachineId(machineId: number): Promise<Record<string, unknown>> {
  const token = await getDexautToken();
  const res = await fetch(`${config.dexautUrl}/QA/getHearBeatByMachineID`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'InDClient/1.0.0',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ playerID: machineId }),
  });
  if (!res.ok) {
    throw new Error(`getHeartBeatByMachineId failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json() as Record<string, unknown>;
  if (!data['success']) {
    throw new Error(`getHeartBeatByMachineId: response not successful: ${JSON.stringify(data)}`);
  }
  return data['data'] as Record<string, unknown>;
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
