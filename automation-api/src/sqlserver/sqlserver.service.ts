import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';
import { DB_MAP } from './sqlserver.constants';

@Injectable()
export class SqlServerService implements OnModuleDestroy {
  private readonly pools = new Map<string, sql.ConnectionPool>();

  constructor(private readonly config: ConfigService) {}

  async getPool(key: string): Promise<sql.ConnectionPool> {
    const database = DB_MAP[key];
    if (!database) {
      throw new NotFoundException(`Unknown SQL Server key: "${key}"`);
    }

    if (!this.pools.has(database)) {
      const pool = await this.createPool(database);
      this.pools.set(database, pool);
    }

    return this.pools.get(database);
  }

  private buildAuthentication(): sql.config['authentication'] {
    const clientSecret = this.config.get<string>('AZURE_SECRET_ID');

    if (clientSecret) {
      return {
        type: 'azure-active-directory-service-principal-secret',
        options: {
          clientId: this.config.getOrThrow<string>('AZURE_CLIENT_ID'),
          clientSecret,
          tenantId: this.config.getOrThrow<string>('AZURE_TENANT_ID'),
        },
      };
    }

    return {
      type: 'azure-active-directory-default',
      options: {
        clientId: this.config.get<string>('AZURE_CLIENT_ID'),
      },
    };
  }

  private async createPool(database: string): Promise<sql.ConnectionPool> {
    const config: sql.config = {
      server: this.config.getOrThrow<string>('SQL_SERVER'),
      database,
      authentication: this.buildAuthentication(),
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
      pool: {
        min: 0,
        max: 10,
        idleTimeoutMillis: 30_000,
      },
    };

    const pool = new sql.ConnectionPool(config);
    pool.on('error', (err) => {
      console.error(`[SqlServer] Pool error for database "${database}":`, err.message);
    });

    await pool.connect();
    return pool;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.pools.values()].map((p) => p.close()));
  }
}
