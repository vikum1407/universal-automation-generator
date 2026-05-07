import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RTMRepository, RTMSnapshot } from './rtm.repository';
import type { RtmRoot }        from './entities/rtm-root.entity';
import type { RtmVersion }     from './entities/rtm-version.entity';
import type { RtmRequirement } from './entities/rtm-requirement.entity';
import type { ImportRtmDto }   from './dto/import-rtm.dto';
import type { CreateRequirementDto, CreateJourneyDto, CreateEndpointDto } from './dto/create-rtm.dto';
import type { UpdateRequirementDto } from './dto/update-requirement.dto';

// ─── CSV parser ────────────────────────────────────────────────────────────────
// Minimal inline CSV parser — avoids adding a dependency for Phase 1.
function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // handle quoted fields with embedded commas
    const values: string[] = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

// ─── Import parsers ────────────────────────────────────────────────────────────

function parseRequirementsFromCSV(raw: string): CreateRequirementDto[] {
  return parseCSV(raw).map((row, i) => ({
    key:         row.key        || row.Key        || `REQ-${String(i + 1).padStart(3, '0')}`,
    title:       row.title      || row.Title      || row.summary || row.Summary || '',
    description: row.description|| row.Description|| row.desc    || '',
    type:        (row.type      || row.Type       || 'functional')  as any,
    priority:    (row.priority  || row.Priority   || 'P2')          as any,
    risk:        (row.risk      || row.Risk       || 'medium')       as any,
    status:      (row.status    || row.Status     || 'draft')        as any,
    tags:        (row.tags      || row.Tags       || '').split(/[;,]/).map((t: string) => t.trim()).filter(Boolean),
  }));
}

// Jira CSV export columns: Issue key, Summary, Description, Priority, Labels, Status
function parseRequirementsFromJira(raw: string): CreateRequirementDto[] {
  return parseCSV(raw).map(row => ({
    key:         row['Issue key'] || row['key']    || '',
    title:       row['Summary']   || row['Title']  || '',
    description: row['Description'] || '',
    type:        'functional' as any,
    priority:    jiraPriorityMap(row['Priority'] || ''),
    risk:        'medium'    as any,
    status:      jiraStatusMap(row['Status'] || ''),
    tags:        (row['Labels'] || '').split(/[;,\s]/).map((t: string) => t.trim()).filter(Boolean),
  })).filter(r => r.key);
}

function jiraPriorityMap(p: string): any {
  const m: Record<string, string> = { Highest: 'P0', High: 'P1', Medium: 'P2', Low: 'P3', Lowest: 'P3' };
  return m[p] ?? 'P2';
}

function jiraStatusMap(s: string): any {
  if (/done|closed|resolved/i.test(s))    return 'approved';
  if (/reject|cancel|deprecat/i.test(s))  return 'deprecated';
  return 'draft';
}

function parseFromJSON(payload: any): {
  requirements: CreateRequirementDto[];
  journeys:     CreateJourneyDto[];
  endpoints:    CreateEndpointDto[];
} {
  const reqs  = (payload.requirements ?? []) as any[];
  const jrns  = (payload.journeys     ?? []) as any[];
  const eps   = (payload.endpoints    ?? []) as any[];
  return {
    requirements: reqs.map((r, i) => ({
      key:         r.key         || `REQ-${String(i + 1).padStart(3, '0')}`,
      title:       r.title       || '',
      description: r.description || '',
      type:        r.type        || 'functional',
      priority:    r.priority    || 'P2',
      risk:        r.risk        || 'medium',
      status:      r.status      || 'draft',
      tags:        Array.isArray(r.tags) ? r.tags : [],
    })),
    journeys: jrns.map((j, i) => ({
      key:             j.key             || `JRN-${String(i + 1).padStart(3, '0')}`,
      name:            j.name            || j.title || '',
      description:     j.description     || '',
      requirementIds:  Array.isArray(j.requirementIds) ? j.requirementIds : [],
    })),
    endpoints: eps.map((e, i) => ({
      key:             e.key             || `EP-${String(i + 1).padStart(3, '0')}`,
      method:          e.method          || 'GET',
      path:            e.path            || '',
      serviceName:     e.serviceName     || null,
      description:     e.description     || '',
      requirementIds:  Array.isArray(e.requirementIds) ? e.requirementIds : [],
    })),
  };
}

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class RTMDomainService {
  constructor(private readonly repo: RTMRepository) {}

  // Initialize RTM for a project (idempotent)
  async initialize(projectId: string, label?: string, createdBy?: string): Promise<{ root: RtmRoot; version: RtmVersion; snapshot: RTMSnapshot }> {
    let root = await this.repo.findRootByProject(projectId);
    if (root) {
      const snapshot = root.currentVersionId
        ? await this.repo.getSnapshot(root.currentVersionId)
        : null;
      if (snapshot) return { root, version: { id: snapshot.versionId, rtmRootId: root.id, versionNumber: snapshot.versionNumber, label: snapshot.label, createdAt: snapshot.createdAt, createdBy: null }, snapshot };
    }

    root = await this.repo.createRoot(projectId);
    const version  = await this.repo.createVersion(root.id, label ?? 'Initial', createdBy);
    await this.repo.setCurrentVersion(root.id, version.id);
    const snapshot = await this.repo.getSnapshot(version.id) as RTMSnapshot;
    return { root, version, snapshot };
  }

  // Import RTM — creates a new version, parses payload, persists
  async import(dto: ImportRtmDto): Promise<RTMSnapshot> {
    let root = await this.repo.findRootByProject(dto.projectId);
    if (!root) {
      root = await this.repo.createRoot(dto.projectId);
    }

    const version = await this.repo.createVersion(root.id, dto.label, dto.createdBy);

    let reqs:  CreateRequirementDto[] = [];
    let jrns:  CreateJourneyDto[]     = [];
    let eps:   CreateEndpointDto[]    = [];

    if (dto.source === 'csv') {
      reqs = parseRequirementsFromCSV(typeof dto.payload === 'string' ? dto.payload : '');
    } else if (dto.source === 'jira') {
      reqs = parseRequirementsFromJira(typeof dto.payload === 'string' ? dto.payload : '');
    } else {
      let jsonPayload: unknown;
      if (typeof dto.payload === 'string') {
        try {
          jsonPayload = JSON.parse(dto.payload);
        } catch {
          throw new BadRequestException(
            'Invalid JSON payload. Please provide a valid RTM JSON object, ' +
            'or switch the source to "csv" or "jira" for plain-text imports.',
          );
        }
      } else {
        jsonPayload = dto.payload;
      }
      const parsed = parseFromJSON(jsonPayload);
      reqs = parsed.requirements;
      jrns = parsed.journeys;
      eps  = parsed.endpoints;
    }

    if (reqs.length)  await this.repo.createManyRequirements(version.id, reqs);
    if (jrns.length)  await this.repo.createManyJourneys(version.id, jrns);
    if (eps.length)   await this.repo.createManyEndpoints(version.id, eps);

    await this.repo.setCurrentVersion(root.id, version.id);
    return this.repo.getSnapshot(version.id) as Promise<RTMSnapshot>;
  }

  // Get current snapshot for a project
  async getSnapshot(projectId: string): Promise<RTMSnapshot | null> {
    const root = await this.repo.findRootByProject(projectId);
    if (!root || !root.currentVersionId) return null;
    return this.repo.getSnapshot(root.currentVersionId);
  }

  // List all versions for a project
  async listVersions(projectId: string): Promise<RtmVersion[]> {
    const root = await this.repo.findRootByProject(projectId);
    if (!root) return [];
    return this.repo.listVersions(root.id);
  }

  // Get a specific version snapshot
  async getVersionSnapshot(projectId: string, versionId: string): Promise<RTMSnapshot> {
    const root = await this.repo.findRootByProject(projectId);
    if (!root) throw new NotFoundException('RTM not initialised for this project');
    const snapshot = await this.repo.getSnapshot(versionId);
    if (!snapshot || snapshot.rootId !== root.id) throw new NotFoundException('Version not found');
    return snapshot;
  }

  // Switch current version
  async activateVersion(projectId: string, versionId: string): Promise<void> {
    const root = await this.repo.findRootByProject(projectId);
    if (!root) throw new NotFoundException('RTM not initialised for this project');
    const ver = await this.repo.findVersionById(versionId);
    if (!ver || ver.rtmRootId !== root.id) throw new NotFoundException('Version not found');
    await this.repo.setCurrentVersion(root.id, versionId);
  }

  // Requirement CRUD
  async createRequirement(projectId: string, dto: CreateRequirementDto): Promise<RtmRequirement> {
    const snapshot = await this.getSnapshot(projectId);
    if (!snapshot) throw new NotFoundException('RTM not initialised. Call /initialize first.');
    return this.repo.createRequirement(snapshot.versionId, dto);
  }

  async updateRequirement(projectId: string, reqId: string, dto: UpdateRequirementDto): Promise<RtmRequirement> {
    await this._assertRequirementInProject(projectId, reqId);
    return this.repo.updateRequirement(reqId, dto);
  }

  async deleteRequirement(projectId: string, reqId: string): Promise<void> {
    await this._assertRequirementInProject(projectId, reqId);
    return this.repo.deleteRequirement(reqId);
  }

  private async _assertRequirementInProject(projectId: string, reqId: string): Promise<void> {
    const snapshot = await this.getSnapshot(projectId);
    if (!snapshot) throw new NotFoundException('RTM not found');
    const exists = snapshot.requirements.some(r => r.id === reqId);
    if (!exists) throw new NotFoundException('Requirement not found in current version');
  }
}
