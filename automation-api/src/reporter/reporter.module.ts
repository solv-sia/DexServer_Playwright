import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReporterController } from './reporter.controller';
import { ReporterService } from './reporter.service';
import { EXECUTION_MODEL, ExecutionSchema } from '../schemas/execution.schema';

@Module({
  imports: [
    ...(process.env.MONGO_URI
      ? [MongooseModule.forFeature([{ name: EXECUTION_MODEL, schema: ExecutionSchema }])]
      : []),
  ],
  controllers: [ReporterController],
  providers: [ReporterService],
})
export class ReporterModule {}
