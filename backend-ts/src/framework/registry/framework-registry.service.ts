import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface RegisterFrameworkDto {
  projectId:        string;
  name:             string;
  frameworkType:    string;
  language:         string;
  blueprintId?:     string;
  artifactLocation?: string;
  isRTMEnabled?:    boolean;
  createdBy?:       string;
}

export interface UpdateFrameworkDto {
  name?:             string;
  isRTMEnabled?:     boolean;
  artifactLocation?: string;
}

@Injectable()
export class FrameworkRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async listForProject(projectId: string) {
    return this.prisma.framework.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const fw = await this.prisma.framework.findUnique({ where: { id } });
    if (!fw) throw new NotFoundException(`Framework ${id} not found`);
    return fw;
  }

  async register(dto: RegisterFrameworkDto) {
    return this.prisma.framework.create({
      data: {
        projectId:        dto.projectId,
        name:             dto.name,
        frameworkType:    dto.frameworkType,
        language:         dto.language,
        blueprintId:      dto.blueprintId,
        artifactLocation: dto.artifactLocation,
        isRTMEnabled:     dto.isRTMEnabled ?? false,
        createdBy:        dto.createdBy,
      },
    });
  }

  async update(id: string, dto: UpdateFrameworkDto) {
    await this.getById(id);
    return this.prisma.framework.update({
      where: { id },
      data: {
        ...(dto.name             !== undefined && { name: dto.name }),
        ...(dto.isRTMEnabled     !== undefined && { isRTMEnabled: dto.isRTMEnabled }),
        ...(dto.artifactLocation !== undefined && { artifactLocation: dto.artifactLocation }),
      },
    });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.framework.delete({ where: { id } });
    return { deleted: true };
  }

  async setProjectDefault(projectId: string, frameworkId: string) {
    await this.getById(frameworkId);
    await this.prisma.project.update({
      where: { id: projectId },
      data: { defaultFrameworkId: frameworkId },
    });
    return { defaultFrameworkId: frameworkId };
  }

  async getRTMEnabledFrameworks(projectId: string) {
    return this.prisma.framework.findMany({
      where: { projectId, isRTMEnabled: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
