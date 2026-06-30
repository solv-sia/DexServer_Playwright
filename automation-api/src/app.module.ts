import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ReporterModule } from './reporter/reporter.module';
import { PlayerModule } from './player/player.module';
import { SqlServerModule } from './sqlserver/sqlserver.module';
import { MachineModule } from './machine/machine.module';
import { ProofOfPlayModule } from './proof-of-play/proof-of-play.module';
import { StoreModule } from './store/store.module';
import { WideEventMiddleware } from './logger/wide-event.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'src/.env' }),
    ...(process.env.MONGO_URI ? [MongooseModule.forRoot(process.env.MONGO_URI)] : []),
    SqlServerModule,
    MachineModule,
    ReporterModule,
    PlayerModule,
    ProofOfPlayModule,
    StoreModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WideEventMiddleware).forRoutes('*');
  }
}
