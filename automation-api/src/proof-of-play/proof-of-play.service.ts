import { Injectable, NotFoundException } from '@nestjs/common';
import { ProofOfPlay } from './entities/ProofOfPlay';
import { ProofOfPlayRepository } from './proof-of-play.repository';

@Injectable()
export class ProofOfPlayService {
  constructor(private readonly proofOfPlayRepository: ProofOfPlayRepository) {}

  async getProofOfPlayEvents(dbKey: string, machineId: number, limit: number): Promise<ProofOfPlay[]> {
    return this.proofOfPlayRepository.getProofOfPlayEvents(dbKey, machineId, limit);
  }
}
