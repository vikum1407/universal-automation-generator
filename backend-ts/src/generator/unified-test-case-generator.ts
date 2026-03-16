import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { IngestedData } from '../metadata/ingested-data.model';
import {
  TestCaseBundleModel,
  UiTestCaseModel,
  ApiTestCaseModel
} from '../metadata/test-case.model';
import { ActionModel } from '../metadata/action.model';

@Injectable()
export class UnifiedTestCaseGenerator {
  generateFromIngested(data: IngestedData): TestCaseBundleModel {
    const uiTestCases: UiTestCaseModel[] = [];
    const apiTestCases: ApiTestCaseModel[] = [];

    const actions: ActionModel[] =
      data.actions || data.pages?.flatMap(p => p.actions) || [];

    // -------------------------
    // UI TEST CASE GENERATION
    // -------------------------
    if (data.pages && data.pages.length > 0) {
      data.pages.forEach(page => {
        const pageActions =
          actions.filter(a => a.pageName === page.name) || page.actions;

        if (!pageActions || pageActions.length === 0) return;

        uiTestCases.push({
          id: uuid(),
          pageName: page.name,
          description: `Basic flow for ${page.name}`,
          actions: pageActions
        });
      });
    }

    // -------------------------
    // API TEST CASE GENERATION
    // -------------------------
    if (data.apiEndpoints && data.apiEndpoints.length > 0) {
      data.apiEndpoints.forEach(ep => {
        apiTestCases.push({
          id: uuid(),
          endpointId: ep.id,
          description: `Positive test for ${ep.method} ${ep.path}`,
          method: ep.method,
          path: ep.path,
          positive: true
        });

        apiTestCases.push({
          id: uuid(),
          endpointId: ep.id,
          description: `Negative test for ${ep.method} ${ep.path}`,
          method: ep.method,
          path: ep.path,
          positive: false
        });
      });
    }

    return {
      uiTestCases,
      apiTestCases,
      apiEndpoints: data.apiEndpoints,
      metadata: data.metadata
    };
  }
}
