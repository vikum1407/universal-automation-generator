import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FrameworkRegistryService, RegisterFrameworkDto, UpdateFrameworkDto } from './framework-registry.service';

@Controller('framework/registry')
export class FrameworkRegistryController {
  constructor(private readonly svc: FrameworkRegistryService) {}

  @Get()
  list(@Query('projectId') projectId: string) {
    return this.svc.listForProject(projectId);
  }

  @Get('rtm-enabled')
  listRTMEnabled(@Query('projectId') projectId: string) {
    return this.svc.getRTMEnabledFrameworks(projectId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  register(@Body() dto: RegisterFrameworkDto) {
    return this.svc.register(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFrameworkDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Post(':id/set-default')
  setDefault(
    @Param('id') id: string,
    @Body('projectId') projectId: string,
  ) {
    return this.svc.setProjectDefault(projectId, id);
  }
}
