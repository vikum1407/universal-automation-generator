import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { GeneratorService } from './generator.service';
import { MetadataBuilder } from '../metadata/metadata.builder';

@Controller('generate')
export class GeneratorController {
  private metadataBuilder = new MetadataBuilder();

  constructor(private readonly generatorService: GeneratorService) {}

  @Post()
  async generate(
    @Body() body: { template: string; openapiUrl: string },
    @Res() res: Response
  ) {
    const { template, openapiUrl } = body;

    const metadata = await this.metadataBuilder.build(template, openapiUrl);

    const zipBuffer = await this.generatorService.generate(template, metadata);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="qlitz-tests.zip"',
      'Content-Length': zipBuffer.length,
    });

    return res.send(zipBuffer);
  }
}
