import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ProofOfPlayService } from './proof-of-play.service';
import { AuthGuard } from '../guards/auth.guard';

@Controller('proof-of-play')
@UseGuards(AuthGuard)
export class ProofOfPlayController {
  constructor(private readonly proofOfPlayService: ProofOfPlayService) {}

  @Get(':dbKey/:machineId')
  getProofOfPlayEvents(
    @Param('dbKey') dbKey: string,
    @Param('machineId', ParseIntPipe) machineId: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
  ) {
    return this.proofOfPlayService.getProofOfPlayEvents(dbKey, machineId, limit);
  }
}
