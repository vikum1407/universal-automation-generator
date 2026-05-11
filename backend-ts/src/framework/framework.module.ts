import { Module } from '@nestjs/common';
import { FrameworkController }         from './framework.controller';
import { FrameworkService }            from './framework.service';
import { FrameworkRegistryController } from './registry/framework-registry.controller';
import { FrameworkRegistryService }    from './registry/framework-registry.service';
import { PrismaService }               from '../../prisma/prisma.service';
import { NodeLibraryService }       from './nodes/node-library.service';
import { NodeFilterService }        from './filter/node-filter.service';
import { BlueprintValidator }       from './blueprint/blueprint-validator';
import { TemplateLoader }           from './templates/template-loader';
import { TemplateResolver }         from './templates/template-resolver';
import { PlaceholderEngine }        from './templates/placeholder-engine';
import { TemplateEngine }           from './templates/template-engine';
import { FolderBuilder }            from './assembly/folder-builder';
import { FileWriter }               from './assembly/file-writer';
import { ZipGenerator }             from './assembly/zip-generator';
import { AssemblyOrchestrator }     from './assembly/assembly-orchestrator';
import { AIClient }                 from './ai/ai-client';
import { AIDocGenerator }           from './ai/ai-doc-generator';
import { AIFileHeaderGenerator }    from './ai/ai-file-header-generator';
import { AIExplainService }         from './ai/ai-explain.service';
import { SampleTestsService }       from './samples/sample-tests.service';
import { SwaggerParserService }              from './swagger/swagger-parser.service';
import { SwaggerValidatorService }           from './swagger/swagger-validator.service';
import { ApiTestGeneratorService }           from './api/api-test-generator.service';
import { PlaywrightCrawlerService }          from './crawler/playwright-crawler.service';
import { PlaywrightApiTestGeneratorService }        from './playwright/playwright-api-test-generator.service';
import { PlaywrightJavaApiTestGeneratorService }    from './playwright/playwright-java-api-test-generator.service';
import { PlaywrightPythonApiTestGeneratorService }  from './playwright/playwright-python-api-test-generator.service';
import { PlaywrightUiTestGeneratorService }         from './playwright/playwright-ui-test-generator.service';
import { PlaywrightJavaUiTestGeneratorService }     from './playwright/playwright-java-ui-test-generator.service';
import { PlaywrightPythonUiTestGeneratorService }   from './playwright/playwright-python-ui-test-generator.service';
import { CodegenParserService }              from './codegen/codegen-parser.service';

@Module({
  controllers: [FrameworkController, FrameworkRegistryController],
  providers: [
    FrameworkService,
    FrameworkRegistryService,
    PrismaService,
    NodeLibraryService,
    NodeFilterService,
    BlueprintValidator,
    TemplateLoader,
    TemplateResolver,
    PlaceholderEngine,
    TemplateEngine,
    FolderBuilder,
    FileWriter,
    ZipGenerator,
    AIClient,
    AIDocGenerator,
    AIFileHeaderGenerator,
    AIExplainService,
    SampleTestsService,
    SwaggerParserService,
    SwaggerValidatorService,
    ApiTestGeneratorService,
    PlaywrightCrawlerService,
    PlaywrightApiTestGeneratorService,
    PlaywrightJavaApiTestGeneratorService,
    PlaywrightPythonApiTestGeneratorService,
    PlaywrightUiTestGeneratorService,
    PlaywrightJavaUiTestGeneratorService,
    PlaywrightPythonUiTestGeneratorService,
    CodegenParserService,
    AssemblyOrchestrator,
  ],
})
export class FrameworkModule {}
