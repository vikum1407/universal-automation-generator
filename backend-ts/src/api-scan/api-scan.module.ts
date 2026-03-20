import { Module } from '@nestjs/common';
import { APIScanController } from './api-scan.controller';
import { APIGenerateController } from './api-generate.controller';
import { ApiIngestionService } from './api-ingestion.service';

@Module({
  controllers: [APIScanController, APIGenerateController],
  providers: [ApiIngestionService],
  exports: [ApiIngestionService],
})
export class APIScanModule {}
