import { Controller, Get, Param } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Controller('projects/:id')
export class APIAnalyticsController {
  @Get('analytics')
  async getAnalytics(@Param('id') id: string) {
    const base = path.join('qlitz-output', id);

    const endpointsFile = path.join(base, 'endpoints.json');
    const rtmFile = path.join(base, 'rtm.json');
    const testsDir = path.join(base, 'tests');

    // Load endpoints
    let endpoints = [];
    if (fs.existsSync(endpointsFile)) {
      endpoints = JSON.parse(fs.readFileSync(endpointsFile, 'utf8'));
    }

    // Load requirements
    let requirements = 0;
    if (fs.existsSync(rtmFile)) {
      const rtm = JSON.parse(fs.readFileSync(rtmFile, 'utf8'));
      requirements = rtm.requirements?.length ?? 0;
    }

    // Load tests
    let tests = 0;
    if (fs.existsSync(testsDir)) {
      tests = fs.readdirSync(testsDir).length;
    }

    return {
      tests,
      passed: 0,
      failed: 0,
      coverage: 0,
      requirements,
      aiSuggestions: 0,
      autoHealed: 0,
      lastRun: null,
      ciStatus: 'not-run'
    };
  }
}
