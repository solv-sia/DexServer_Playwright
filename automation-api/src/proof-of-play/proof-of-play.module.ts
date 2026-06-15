import { Module } from '@nestjs/common';
import { ProofOfPlayController } from './proof-of-play.controller';
import { ProofOfPlayService } from './proof-of-play.service';
import { ProofOfPlayRepository } from './proof-of-play.repository';

@Module({
  controllers: [ProofOfPlayController],
  providers: [ProofOfPlayService, ProofOfPlayRepository],
})
export class ProofOfPlayModule {}
