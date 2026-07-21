import { IsIn, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

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

  // Se requiere activationKey O customerId (no ambos, no ninguno).
  @ValidateIf((o) => !o.customerId)
  @IsString()
  activationKey?: string;

  @ValidateIf((o) => !o.activationKey)
  @IsNumber()
  customerId?: number;

  // dbKey solo es necesario cuando se usa customerId para resolver la activation key en la BD.
  @IsOptional()
  @IsString()
  dbKey?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
