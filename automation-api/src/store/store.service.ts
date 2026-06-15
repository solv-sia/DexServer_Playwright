import { Injectable } from '@nestjs/common';
import { StoreRepository } from './store.repository';

@Injectable()
export class StoreService {
  constructor(private readonly storeRepository: StoreRepository) {}

  async cleanProducts(dbKey: string, customerId: number): Promise<void> {
    await this.storeRepository.cleanProducts(dbKey, customerId);
  }
}
