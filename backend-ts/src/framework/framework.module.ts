import { Module } from '@nestjs/common';
import { FrameworkController }      from './framework.controller';
import { FrameworkService }         from './framework.service';
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

@Module({
  controllers: [FrameworkController],
  providers: [
    FrameworkService,
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
    AssemblyOrchestrator,
  ],
})
export class FrameworkModule {}
