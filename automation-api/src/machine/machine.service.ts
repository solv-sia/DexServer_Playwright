import { Injectable, NotFoundException } from '@nestjs/common';
import { MachineRepository } from './machine.repository';
import { Machine } from './entities/Machine';

@Injectable()
export class MachineService {
  constructor(private readonly machineRepository: MachineRepository) {}

  async getMachine(dbKey: string, serialNumber: string): Promise<Machine> {
    const machine = await this.machineRepository.findBySerialNumber(dbKey, serialNumber);
    if (!machine) {
      throw new NotFoundException(`Machine with serial number "${serialNumber}" not found`);
    }
    return machine;
  }

  async deleteMachine(dbKey: string, machineId: number): Promise<{ deleted: boolean }> {
    await this.machineRepository.deleteById(dbKey, machineId);
    return { deleted: true };
  }
}
