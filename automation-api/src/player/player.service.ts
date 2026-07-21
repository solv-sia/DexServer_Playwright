import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { v1 as uuidv1 } from 'uuid';
import { SqlServerService } from '../sqlserver/sqlserver.service';

@Injectable()
export class PlayerService {
  constructor(private readonly sqlServer: SqlServerService) {}

  // Resuelve la activation key del tenant desde la BD cuando solo se tiene el customerId.
  private async getActivationKeyByCustomerId(dbKey: string, customerId: number): Promise<string> {
    const pool = await this.sqlServer.getPool(dbKey);
    const result = await pool
      .request()
      .input('customerId', customerId)
      .query('SELECT TOP 1 ActivationKey FROM Customer WHERE CustomerId = @customerId');

    const row = result.recordset[0];
    if (!row?.ActivationKey) {
      throw new BadRequestException(`No se encontró ActivationKey para customerId ${customerId} en la BD "${dbKey}"`);
    }
    return row.ActivationKey as string;
  }

  async createPlayer(baseUrl: string, activationKeyOrCustomerId: { activationKey?: string; customerId?: number; dbKey?: string }, name?: string): Promise<any> {
    let activationKey = activationKeyOrCustomerId.activationKey;

    if (!activationKey) {
      const { customerId, dbKey } = activationKeyOrCustomerId;
      if (!customerId || !dbKey) {
        throw new BadRequestException('Se requiere activationKey o bien customerId+dbKey');
      }
      activationKey = await this.getActivationKeyByCustomerId(dbKey, customerId);
    }

    const serialNumber = uuidv1();
    const url = `${baseUrl}/DexFrontend/api/v3/doHandshake`;

    const body = {
      SerialNumber: serialNumber,
      MessageKey: '',
      DeviceType: 'Tizen',
      Version: '6.4.2408.2600',
      Name: name ?? `playerheadless ${serialNumber}`,
      CustomerActivationKey: activationKey,
      Brand: '',
      MacAddress: '',
      IpLocalAddress: '',
      Imei: '',
    };

    const response = await axios({
      method: 'POST',
      url,
      responseType: 'json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8',
      },
      data: JSON.stringify(body),
    });

    return { ...response.data, SerialNumber: serialNumber };
  }

  async simulateDownloads(
    baseUrl: string,
    customerId: number,
    messageKey: string,
    machineId: number,
  ): Promise<{ success: boolean; filesUpdated: number }> {
    const heartbeatUrl = `${baseUrl}/DexFrontend/api/v3/heartBeatSync/${machineId}/${messageKey}`;
    await axios.post(heartbeatUrl, {}, { validateStatus: () => true });

    return { success: true, filesUpdated: 0 };
  }
}
