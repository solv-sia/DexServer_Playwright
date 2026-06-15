import { Global, Module } from '@nestjs/common';
import { SqlServerService } from './sqlserver.service';

@Global()
@Module({
  providers: [SqlServerService],
  exports: [SqlServerService],
})
export class SqlServerModule {}
