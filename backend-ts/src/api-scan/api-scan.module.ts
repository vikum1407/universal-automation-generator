import { Module } from '@nestjs/common';
import { APIScanController } from './api-scan.controller';
import { APIGenerateController } from './api-generate.controller';

@Module({
  controllers: [APIScanController, APIGenerateController],
})
export class APIScanModule {}
