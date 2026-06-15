import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { v1 as uuidv1 } from 'uuid';

@Injectable()
export class PlayerService {
  async createPlayer(baseUrl: string, activationKey: string, name?: string): Promise<any> {
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
    // Trigger a heartbeat so DexServer registers the player as active.
    // Real download progress is reported by the player via heartbeat body;
    // for a headless virtual player we just send an empty heartbeat.
    const heartbeatUrl = `${baseUrl}/DexFrontend/api/v3/heartBeatSync/${machineId}/${messageKey}`;
    await axios.post(heartbeatUrl, {}, { validateStatus: () => true });

    return { success: true, filesUpdated: 0 };
  }
}
