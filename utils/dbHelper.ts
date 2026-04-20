/**
 * DB Connection helper — implementar el driver según el motor de DexServer.
 *
 * Instalar dependencias:
 *   SQL Server : npm install mssql
 *   PostgreSQL : npm install pg
 *   MySQL      : npm install mysql2
 *
 * Variables de entorno a agregar en .env.demo5:
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */

export interface DBRow {
  [key: string]: unknown;
}

export interface DBClient {
  query(sql: string): Promise<DBRow[]>;
  close(): Promise<void>;
}

// ─── IMPLEMENTAR AQUÍ ────────────────────────────────────────────────────────
export async function connectDB(): Promise<DBClient> {
  // ── SQL Server (mssql) ──
  // const mssql = await import('mssql');
  // const pool = await mssql.connect({
  //   server  : process.env.DB_HOST     ?? 'localhost',
  //   port    : parseInt(process.env.DB_PORT ?? '1433'),
  //   database: process.env.DB_NAME     ?? 'DexServer',
  //   user    : process.env.DB_USER     ?? '',
  //   password: process.env.DB_PASSWORD ?? '',
  //   options : { trustServerCertificate: true },
  // });
  // return {
  //   query: async (sql) => (await pool.request().query(sql)).recordset,
  //   close: async () => pool.close(),
  // };

  // ── PostgreSQL (pg) ──
  // const { Client } = await import('pg');
  // const client = new Client({
  //   host    : process.env.DB_HOST,
  //   port    : parseInt(process.env.DB_PORT ?? '5432'),
  //   database: process.env.DB_NAME,
  //   user    : process.env.DB_USER,
  //   password: process.env.DB_PASSWORD,
  // });
  // await client.connect();
  // return {
  //   query: async (sql) => (await client.query(sql)).rows,
  //   close: async () => client.end(),
  // };

  throw new Error(
    'connectDB: no implementado. Configurar driver y credenciales en utils/dbHelper.ts'
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// Ajustar nombres de tablas/columnas al schema real de DexServer.

export async function dbGetPlayer(db: DBClient, playerName: string): Promise<DBRow | null> {
  const rows = await db.query(
    `SELECT * FROM Players WHERE Name = '${playerName}'`
  );
  return rows[0] ?? null;
}

export async function dbGetPlayerVersion(db: DBClient, playerName: string): Promise<string | null> {
  const rows = await db.query(
    `SELECT InstalledVersion FROM Players WHERE Name = '${playerName}'`
  );
  return (rows[0]?.InstalledVersion as string) ?? null;
}

export async function dbGetPlayerLastActivity(db: DBClient, playerName: string): Promise<Date | null> {
  const rows = await db.query(
    `SELECT LastActivity FROM Players WHERE Name = '${playerName}'`
  );
  const val = rows[0]?.LastActivity;
  return val ? new Date(val as string) : null;
}

export async function dbGetPlayerPolicies(db: DBClient, playerName: string): Promise<DBRow | null> {
  const rows = await db.query(`
    SELECT hp.Name AS HardwarePolicy, tp.Name AS TransmissionPolicy
    FROM   Players p
    LEFT JOIN HardwarePolicies   hp ON p.HardwarePolicyId   = hp.Id
    LEFT JOIN TransmissionPolicies tp ON p.TransmissionPolicyId = tp.Id
    WHERE  p.Name = '${playerName}'
  `);
  return rows[0] ?? null;
}

export async function dbGetPlayerDownloads(
  db: DBClient,
  playerName: string,
  playlistName: string
): Promise<DBRow[]> {
  return db.query(`
    SELECT d.Status, d.CompletedAt
    FROM   Downloads d
    JOIN   Players   p  ON d.PlayerId   = p.Id
    JOIN   Playlists pl ON d.PlaylistId = pl.Id
    WHERE  p.Name  = '${playerName}'
    AND    pl.Name = '${playlistName}'
  `);
}

export async function dbGetDownloadEvents(db: DBClient, playerName: string): Promise<DBRow[]> {
  return db.query(`
    SELECT EventType, CreatedAt, Detail
    FROM   PlayerEvents
    WHERE  PlayerName = '${playerName}'
    ORDER  BY CreatedAt DESC
  `);
}

export async function dbGetPlayerPlaylist(db: DBClient, playerName: string): Promise<string | null> {
  const rows = await db.query(`
    SELECT pl.Name AS PlaylistName
    FROM   Players   p
    LEFT JOIN Playlists pl ON p.PlaylistId = pl.Id
    WHERE  p.Name = '${playerName}'
  `);
  return (rows[0]?.PlaylistName as string) ?? null;
}
