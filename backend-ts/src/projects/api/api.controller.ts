import { Controller, Get, Post, Param, Body, UploadedFile, UseInterceptors } from "@nestjs/common";
import * as fs from "fs";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("projects/:id/api")
export class APIController {
  // Upload Swagger file
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadSwagger(@UploadedFile() file: any) {
    return { filePath: file.path };
  }

  // Get API endpoints
  @Get("endpoints")
  async getEndpoints(@Param("id") id: string) {
    const file = `./generated-api-project/${id}/endpoints.json`;
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  // Get RTM (API version)
  @Get("rtm")
  async getRTM(@Param("id") id: string) {
    const apiFile = `./generated-api-project/${id}/rtm.json`;
    if (!fs.existsSync(apiFile)) return { generatedAt: "", requirements: [] };
    return JSON.parse(fs.readFileSync(apiFile, "utf8"));
  }
}
