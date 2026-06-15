import { IsIn, IsOptional, IsString } from 'class-validator';

const ALLOWED_BASE_URLS = [
  'https://demo5.dexmanager.com',
  'https://mcdqa.dexmanager.com',
  'https://serverqa.dexmanager.com',
  'https://demo4.dexmanager.com',
  'https://demo.dexmanager.com',
  'https://demo2.dexmanager.com',
];

export class CreatePlayerDto {
  @IsIn(ALLOWED_BASE_URLS)
  baseUrl: string;

  @IsString()
  activationKey: string;

  @IsOptional()
  @IsString()
  name?: string;
}
