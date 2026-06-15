import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class InitDto {
  @IsNumber()
  @Type(() => Number)
  runId: number;

  @IsString()
  project: string;

  @IsString()
  framework: string;

  @IsOptional()
  @IsBoolean()
  debug?: boolean;
}
