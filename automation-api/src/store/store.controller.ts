import { Controller, Delete, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { AuthGuard } from '../guards/auth.guard';

@Controller('store')
@UseGuards(AuthGuard)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Delete('clean-products/:dbKey/:customerId')
  cleanProducts(
    @Param('dbKey') dbKey: string,
    @Param('customerId', ParseIntPipe) customerId: number,
  ): Promise<void> {
    return this.storeService.cleanProducts(dbKey, customerId);
  }
}
