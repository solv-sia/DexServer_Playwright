import { IsIn, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

const ALLOWED_BASE_URLS = [
  'https://demo5.dexmanager.com',
  'https://mcdqa.dexmanager.com',
  'https://serverqa.dexmanager.com',
  'https://demo4.dexmanager.com',
  'https://demo.dexmanager.com',
  'https://demo2.dexmanager.com',
];

export class SimulateDownloadsDto {
  @IsIn(ALLOWED_BASE_URLS)
  baseUrl: string;

  @IsNumber()
  @Type(() => Number)
  customerId: number;

  @IsString()
  messageKey: string;

  @IsNumber()
  @Type(() => Number)
  machineId: number;
}
