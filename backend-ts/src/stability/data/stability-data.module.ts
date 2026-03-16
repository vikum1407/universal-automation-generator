import { Module } from '@nestjs/common';
import { StabilityDataService } from './stability-data.service';

@Module({
  providers: [
    StabilityDataService,
    // TODO: register real providers here
  ],
  exports: [StabilityDataService]
})
export class StabilityDataModule {}
