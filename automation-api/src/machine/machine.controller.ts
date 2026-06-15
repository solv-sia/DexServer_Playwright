import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { MachineService } from './machine.service';
import { AuthGuard } from '../guards/auth.guard';

@Controller('machine')
@UseGuards(AuthGuard)
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  @Get(':dbKey/:serialNumber')
  getMachine(
    @Param('dbKey') dbKey: string,
    @Param('serialNumber') serialNumber: string,
  ) {
    return this.machineService.getMachine(dbKey, serialNumber);
  }

  @Delete(':dbKey/:machineId')
  deleteMachine(
    @Param('dbKey') dbKey: string,
    @Param('machineId') machineId: string,
  ) {
    return this.machineService.deleteMachine(dbKey, Number(machineId));
  }
}
