import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ResultDto {
  @IsNumber()
  @Type(() => Number)
  runId: number;

  @IsString()
  cypressId: string;

  @IsString()
  @IsIn(['passed', 'failed', 'blocked', 'retest', 'untested'])
  status: 'passed' | 'failed' | 'blocked' | 'retest' | 'untested';

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  elapsed?: string;

  @IsOptional()
  @IsString()
  defects?: string;

  @IsOptional()
  @IsString()
  customComment?: string;
}
