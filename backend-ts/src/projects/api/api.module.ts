import { Module } from '@nestjs/common';
import { APIController } from './api.controller';
import { ApiService } from './api.service';
import { ApiTestGenerationService } from './api-test-generation.service';

import { APITestGenerator } from '../../api-scan/api-test-generator';
import { APITestWriter } from '../../api-scan/api-test-writer';

@Module({
  controllers: [APIController],
  providers: [
    ApiService,
    ApiTestGenerationService,
    APITestGenerator,
    APITestWriter,
  ],
  exports: [ApiService, ApiTestGenerationService],
})
export class ApiModule {}
