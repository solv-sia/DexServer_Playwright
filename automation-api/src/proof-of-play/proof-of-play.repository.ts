import { Injectable } from '@nestjs/common';
import { SqlServerService } from '../sqlserver/sqlserver.service';
import { ProofOfPlay } from './entities/ProofOfPlay';

@Injectable()
export class ProofOfPlayRepository {
  constructor(private readonly sqlServer: SqlServerService) {}

  async getProofOfPlayEvents(dbKey: string, machineId: number, limit:number = 25): Promise<ProofOfPlay[]> {
    const pool = await this.sqlServer.getPool(dbKey);
    const result = await pool
      .request()
      .input('machineId', machineId)
      .query(`SELECT TOP ${limit} p.MachineId, p.ProofOfPlayId, p.MediaComponentName FROM ProofOfPlay p WHERE p.MachineId = @machineId ORDER BY p.ProofOfPlayId DESC`);

    const row = result.recordsets;
    if (!row) return null;

    let listPop:ProofOfPlay[] = result.recordset.map(x => {
      return new ProofOfPlay(x.ProofOfPlayId, x.MachineId, x.MediaComponentName);
    })
    return listPop;
  }
}