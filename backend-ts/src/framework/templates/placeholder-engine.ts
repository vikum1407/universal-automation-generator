import { Injectable } from '@nestjs/common';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';

export type PlaceholderContext = Record<string, string>;

@Injectable()
export class PlaceholderEngine {

  buildContext(blueprint: FrameworkBlueprint): PlaceholderContext {
    const archNode    = blueprint.nodes?.find(n => n.nodeId === blueprint.architecture);
    const archConfig  = archNode?.config ?? {};
    const execConfig  = (blueprint.executionConfig ?? {}) as Record<string, any>;

    const basePackage    = (archConfig['basePackage'] as string) ?? 'com.qlitz';
    const reportingTool  = this.detectReportingTool(blueprint);
    const projectName    = blueprint.metadata?.name ?? 'qlitz-framework';

    const distCtx = this.buildDistributedContext(blueprint, projectName);

    return {
      PROJECT_NAME:              projectName,
      FRAMEWORK:                 blueprint.framework ?? '',
      LANGUAGE:                  blueprint.language ?? '',
      BASE_URL:                  execConfig['baseUrl'] ?? 'https://example.com',
      BROWSER:                   execConfig['browser'] ?? 'chrome',
      PARALLEL:                  String(execConfig['parallel'] ?? false),
      THREAD_COUNT:              String(execConfig['threadCount'] ?? 1),
      RETRY_COUNT:               String(execConfig['retryCount'] ?? 0),
      TIMEOUT:                   String(execConfig['timeout'] ?? 30000),
      HEADLESS:                  String(execConfig['headless'] ?? false),
      BASE_PACKAGE:              basePackage,
      BASE_PACKAGE_PATH:         basePackage.replace(/\./g, '/'),
      DRIVER_MANAGER:            (archConfig['driverManager'] as string) ?? 'webdrivermanager',
      AUTHOR:                    blueprint.metadata?.author ?? 'Qlitz Generator',
      VERSION:                   blueprint.metadata?.version ?? '1.0.0',
      YEAR:                      String(new Date().getFullYear()),
      REPORTING_TOOL:            reportingTool,
      REPORTING_DEPENDENCIES_XML: this.buildReportingDepsXml(reportingTool),
      REPORTING_PLUGINS_XML:      this.buildReportingPluginsXml(reportingTool),
      REPORTING_IMPORT:           this.buildReportingImport(reportingTool, basePackage),
      REPORTING_ANNOTATION:       this.buildReportingAnnotation(reportingTool),
      REPORTER_CONFIG:            this.buildReporterConfig(reportingTool),
      ...distCtx,
    };
  }

  // ─── Distributed context ───────────────────────────────────────────────────

  private buildDistributedContext(blueprint: FrameworkBlueprint, projectName: string): PlaceholderContext {
    const nodes = blueprint.nodes ?? [];

    const dockerNode    = nodes.find(n => ['distributed-docker', 'playwright-ts-docker', 'cypress-ts-docker'].includes(n.nodeId));
    const composeNode   = nodes.find(n => n.nodeId === 'distributed-docker-compose-grid');
    const k8sNode       = nodes.find(n => n.nodeId === 'distributed-k8s-grid');
    const grid4Node     = nodes.find(n => n.nodeId === 'selenium-java-grid4');
    const shardNode     = nodes.find(n => n.nodeId === 'playwright-ts-sharding');

    const dockerCfg  = (dockerNode  ?? composeNode)?.config ?? {};
    const k8sCfg     = k8sNode?.config ?? {};
    const gridCfg    = (grid4Node ?? composeNode)?.config ?? {};
    const shardCfg   = shardNode?.config ?? {};

    // Frontend review-page overrides arrive via executionConfig
    const execDistCfg = (blueprint.executionConfig ?? {}) as Record<string, any>;

    const imageName  = (execDistCfg['dockerImageName'] as string)
                    ?? (dockerCfg['imageName'] as string)
                    ?? projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const imageTag   = (execDistCfg['dockerImageTag']  as string)
                    ?? (dockerCfg['imageTag']  as string)
                    ?? 'latest';

    return {
      DOCKER_IMAGE_NAME:   imageName,
      DOCKER_IMAGE_TAG:    imageTag,
      DOCKER_APP_NAME:     imageName,
      K8S_NAMESPACE:       (execDistCfg['k8sNamespace'] as string) ?? (k8sCfg['namespace'] as string) ?? 'qa-automation',
      K8S_APP_NAME:        imageName,
      K8S_IMAGE_NAME:      (k8sCfg['imageName']       as string) ?? imageName,
      K8S_IMAGE_TAG:       (k8sCfg['imageTag']        as string) ?? imageTag,
      GRID_SERVICE_NAME:   (k8sCfg['gridServiceName'] as string) ?? 'selenium-hub',
      K8S_NODE_REPLICAS:   String((k8sCfg['nodeReplicas']     as number) ?? 2),
      GRID_HUB_URL:        (execDistCfg['gridHubUrl']  as string) ?? (gridCfg['gridHubUrl'] as string) ?? (gridCfg['hubUrl'] as string) ?? 'http://selenium-hub:4444',
      GRID_HUB_PORT:       String((composeNode?.config?.['gridHubPort'] as number) ?? (grid4Node?.config?.['hubUrl'] as string)?.match(/:(\d+)/)?.[1] ?? 4444),
      GRID_NODE_COUNT:     String((composeNode?.config?.['nodeCount']   as number) ?? 2),
      TOTAL_SHARDS:        String((shardCfg['totalShards']  as number) ?? 4),
      CLOUD_PROVIDER:      this.detectCloudProvider(blueprint),
    };
  }

  private detectCloudProvider(blueprint: FrameworkBlueprint): string {
    const ids = (blueprint.nodes ?? []).map(n => n.nodeId);
    if (ids.includes('all-lambdatest'))  return 'lambdatest';
    if (ids.includes('all-saucelabs'))   return 'saucelabs';
    if (ids.includes('cypress-ts-cloud')) return 'cypress-cloud';
    return 'none';
  }

  apply(content: string, ctx: PlaceholderContext): string {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      ctx[key] !== undefined ? ctx[key] : `{{${key}}}`
    );
  }

  applyToPath(filePath: string, ctx: PlaceholderContext): string {
    return filePath.replace(/__(\w+)__/g, (_, key) =>
      ctx[key] !== undefined ? ctx[key] : key
    );
  }

  // ─── Reporting helpers ─────────────────────────────────────────────────────

  private detectReportingTool(blueprint: FrameworkBlueprint): string {
    const ids = (blueprint.nodes ?? []).map(n => n.nodeId);
    if (ids.some(id => id.includes('allure')))       return 'allure';
    if (ids.some(id => id.includes('extent')))       return 'extent';
    if (ids.some(id => id.includes('mochawesome')))  return 'mochawesome';
    if (ids.some(id => id.includes('html')))         return 'html';
    return 'none';
  }

  private buildReportingDepsXml(tool: string): string {
    if (tool === 'allure') return `\
        <!-- Allure TestNG -->
        <dependency>
            <groupId>io.qameta.allure</groupId>
            <artifactId>allure-testng</artifactId>
            <version>\${allure.version}</version>
        </dependency>`;
    if (tool === 'extent') return `\
        <!-- Extent Reports -->
        <dependency>
            <groupId>com.aventstack</groupId>
            <artifactId>extentreports</artifactId>
            <version>5.1.1</version>
        </dependency>`;
    return '        <!-- No additional reporting dependencies -->';
  }

  private buildReportingPluginsXml(tool: string): string {
    if (tool === 'allure') return `\
            <plugin>
                <groupId>io.qameta.allure</groupId>
                <artifactId>allure-maven</artifactId>
                <version>2.12.0</version>
                <configuration>
                    <reportVersion>\${allure.version}</reportVersion>
                </configuration>
            </plugin>`;
    return '            <!-- No additional reporting plugins -->';
  }

  private buildReportingImport(tool: string, pkg: string): string {
    if (tool === 'allure') return `import ${pkg}.listeners.AllureListener;`;
    if (tool === 'extent') return `import ${pkg}.listeners.ExtentReportListener;`;
    return '';
  }

  private buildReportingAnnotation(tool: string): string {
    if (tool === 'allure') return '@Listeners(AllureListener.class)';
    if (tool === 'extent') return '@Listeners(ExtentReportListener.class)';
    return '';
  }

  private buildReporterConfig(tool: string): string {
    if (tool === 'allure')       return "reporter: ['allure-playwright']";
    if (tool === 'mochawesome')  return "reporter: [['mocha-junit-reporter', { mochaFile: 'results/test-results.xml' }]]";
    return "reporter: 'html'";
  }
}
