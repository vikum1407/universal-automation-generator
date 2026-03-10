import { Module } from '@nestjs/common';
import { UIScanController } from './ui-scan.controller';

@Module({
  controllers: [UIScanController],
})
export class UIScanModule {}
