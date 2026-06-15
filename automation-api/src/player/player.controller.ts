import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PlayerService } from './player.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { SimulateDownloadsDto } from './dto/simulate-downloads.dto';
import { AuthGuard } from '../guards/auth.guard';

@Controller('player')
@UseGuards(AuthGuard)
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post()
  createPlayer(@Body() dto: CreatePlayerDto) {
    return this.playerService.createPlayer(dto.baseUrl, dto.activationKey, dto.name);
  }

  @Post('simulate-downloads')
  simulateDownloads(@Body() dto: SimulateDownloadsDto) {
    return this.playerService.simulateDownloads(dto.baseUrl, dto.customerId, dto.messageKey, dto.machineId);
  }
}
