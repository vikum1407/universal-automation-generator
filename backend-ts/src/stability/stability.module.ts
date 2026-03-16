import { Module } from '@nestjs/common';
import { StabilityController } from './stability.controller';

@Module({
  controllers: [StabilityController],
  providers: [],
  exports: []
})
export class StabilityModule {}
