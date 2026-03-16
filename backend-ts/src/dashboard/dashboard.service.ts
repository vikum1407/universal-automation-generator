import { Injectable } from '@nestjs/common';
import { HistoryService } from '../history/history.service';

import { ReleaseIntelligenceEngine } from './release-intelligence.engine';
import { ReleaseNotesEngine } from './release-notes.engine';
import { ReleaseTimelineEngine } from './release-timeline.engine';
import { QualityGatesEngine } from './quality-gates.engine';
import { UnifiedReleaseReportEngine } from './unified-release-report.engine';
import { ExecutionInsightsEngine } from './execution-insights.engine';
import { ReleaseReadinessEngine } from './release-readiness.engine';
import { ReleaseHeatmapEngine } from './release-heatmap.engine';
import { ReleaseStoryEngine } from './release-story.engine';
import { ReleaseEvolutionEngine } from './release-evolution.engine';

import { RequirementRiskEngine } from './requirement-risk.engine';
import { RequirementHistoryEngine } from './requirement-history.engine';
import { RequirementPatternsEngine } from './requirement-patterns.engine';
import { RequirementFixesEngine } from './requirement-fixes.engine';
import { SelfHealingEngine } from './self-healing.engine';

@Injectable()
export class DashboardService {
  constructor(
    private readonly history: HistoryService,
    private readonly insightsEngine: ExecutionInsightsEngine,
    private readonly readinessEngine: ReleaseReadinessEngine,
    private readonly releaseEngine: ReleaseIntelligenceEngine,
    private readonly notesEngine: ReleaseNotesEngine,
    private readonly timelineEngine: ReleaseTimelineEngine,
    private readonly gatesEngine: QualityGatesEngine,
    private readonly unifiedEngine: UnifiedReleaseReportEngine,
    private readonly heatmapEngine: ReleaseHeatmapEngine,
    private readonly storyEngine: ReleaseStoryEngine,
    private readonly evolutionEngine: ReleaseEvolutionEngine,

    private readonly requirementRiskEngine: RequirementRiskEngine,
    private readonly requirementHistoryEngine: RequirementHistoryEngine,
    private readonly requirementPatternsEngine: RequirementPatternsEngine,
    private readonly requirementFixesEngine: RequirementFixesEngine,
    private readonly selfHealingEngine: SelfHealingEngine
  ) {}

  listProjects() {
    const runs = this.history.listRuns('*');
    const projects = new Set<string>();
    runs.forEach(r => projects.add(r.project));
    return Array.from(projects);
  }

  listRuns(project: string) {
    return this.history.listRuns(project);
  }

  latestRun(project: string) {
    const runs = this.history.listRuns(project);
    return runs.length ? runs[0] : null;
  }

  trends(project: string) {
    return this.history.computeTrends(project);
  }

  insights(project: string) {
    const runs = this.history.listRuns(project);
    return this.insightsEngine.compute(runs);
  }

  rrs(project: string) {
    const runs = this.history.listRuns(project);
    if (!runs.length) return this.readinessEngine['empty']?.() ?? null;

    const currentInsights = this.insightsEngine.compute(runs);
    const previousInsights =
      runs.length > 1 ? this.insightsEngine.compute(runs.slice(1)) : null;

    return this.readinessEngine.compute(
      runs,
      currentInsights,
      previousInsights
    );
  }

  releaseIntelligence(project: string) {
    const runs = this.history.listRuns(project);
    if (!runs.length) return null;

    const latest = runs[0];
    const previous = runs[1];

    return this.releaseEngine.compute(latest, previous);
  }

  releaseNotes(project: string) {
    const runs = this.history.listRuns(project);
    if (!runs.length) return null;

    const latest = runs[0];
    const previous = runs[1];

    return this.notesEngine.generate(latest, previous);
  }

  releaseTimeline(project: string) {
    const runs = this.history.listRuns(project);
    return this.timelineEngine.buildTimeline(runs);
  }

  compare(project: string, from: number, to: number) {
    const runs = this.history.listRuns(project);
    if (!runs[from] || !runs[to]) return null;
    return this.timelineEngine.compareRuns(runs[from], runs[to]);
  }

  qualityGate(project: string) {
    const latest = this.latestRun(project);
    if (!latest) return null;
    return this.gatesEngine.evaluate(latest);
  }

  unifiedReport(project: string) {
    const runs = this.history.listRuns(project);
    if (!runs.length) return null;

    const latest = runs[0];
    const previous = runs[1];

    return this.unifiedEngine.generate(latest, previous, runs);
  }

  heatmap(project: string) {
    const runs = this.history.listRuns(project);
    const insights = this.insightsEngine.compute(runs);
    return this.heatmapEngine.compute(runs, insights);
  }

  releaseStory(project: string) {
    const runs = this.history.listRuns(project);
    if (!runs.length) return null;

    const latest = runs[0];
    const previous = runs[1];

    const currentInsights = this.insightsEngine.compute(runs);
    const previousInsights =
      runs.length > 1 ? this.insightsEngine.compute(runs.slice(1)) : null;

    const readiness = this.readinessEngine.compute(
      runs,
      currentInsights,
      previousInsights
    );

    return this.storyEngine.compute(
      latest,
      previous,
      currentInsights,
      previousInsights,
      readiness
    );
  }

  evolution(project: string) {
    const runs = this.history.listRuns(project);
    return this.evolutionEngine.compute(runs);
  }

  selfHealingSummary(project: string) {
    const runs = this.history.listRuns(project);
    return this.selfHealingEngine.compute(runs);
  }

  selfHealingDetails(project: string, suggestionId: string) {
    const runs = this.history.listRuns(project);
    const summary = this.selfHealingEngine.compute(runs);
    const suggestion = this.selfHealingEngine.findSuggestion(summary, suggestionId);
    return { project, suggestion, summary };
  }

  // ---------------------------------------------------------
  // C18 REQUIREMENT RISK EXPLORER
  // ---------------------------------------------------------

  listRequirements(project: string) {
    const runs = this.history.listRuns(project);
    return this.requirementRiskEngine.computeGroupedRisk(runs);
  }

  getRequirementDetails(project: string, requirementId: string) {
    const runs = this.history.listRuns(project);
    const grouped = this.requirementRiskEngine.computeGroupedRisk(runs);
    const risk = grouped.all.find(r => r.requirement.id === requirementId) ?? null;

    const history = this.requirementHistoryEngine.buildHistory(requirementId, runs);
    const patterns = this.requirementPatternsEngine.detectPatterns(requirementId, runs);

    const requirement =
      risk?.requirement ??
      runs[0]?.rtm.requirements.find(r => r.id === requirementId);

    const fixes = requirement
      ? this.requirementFixesEngine.generateSuggestions(requirement, patterns)
      : [];

    return {
      requirementId,
      risk,
      history,
      patterns,
      fixes
    };
  }
}
