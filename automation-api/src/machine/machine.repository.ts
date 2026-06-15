import { Injectable } from '@nestjs/common';
import { SqlServerService } from '../sqlserver/sqlserver.service';
import { Machine } from './entities/Machine';

@Injectable()
export class MachineRepository {
  constructor(private readonly sqlServer: SqlServerService) {}

  async deleteById(dbKey: string, machineId: number): Promise<void> {
    const pool = await this.sqlServer.getPool(dbKey);
    await pool
      .request()
      .input('machineId', machineId)
      .query('DELETE FROM Machine WHERE MachineId = @machineId');
  }

  async findBySerialNumber(dbKey: string, serialNumber: string): Promise<Machine> {
    const pool = await this.sqlServer.getPool(dbKey);
    const result = await pool
      .request()
      .input('serialNumber', serialNumber)
      .query('SELECT m.MachineId, m.CustomerId, m.[Name], m.ActivationKey, m.SerialNumber, m.MessageKey FROM Machine m WHERE m.SerialNumber = @serialNumber');

    const row = result.recordset[0];
    if (!row) return null;

    return new Machine(row.MachineId, row.CustomerId, row.Name, row.ActivationKey, row.SerialNumber, row.MessageKey);
  }
}