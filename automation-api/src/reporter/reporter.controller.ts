import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ReporterService } from './reporter.service';
import { AuthGuard } from '../guards/auth.guard';
import { InitDto } from './dto/init.dto';
import { ResultDto } from './dto/result.dto';

@Controller()
export class ReporterController {
  constructor(private readonly reporterService: ReporterService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'automation-api',
      version: process.env.APP_VERSION || 'dev',
      timestamp: new Date().toISOString(),
      activeSessions: this.reporterService.getActiveSessions(),
    };
  }

  @UseGuards(AuthGuard)
  @Post('init')
  async init(@Body() dto: InitDto) {
    const result = await this.reporterService.initSession(dto);
    return { success: true, ...result };
  }

  @UseGuards(AuthGuard)
  @Post('result')
  async result(@Body() dto: ResultDto) {
    return this.reporterService.addResult(dto);
  }

  @UseGuards(AuthGuard)
  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = path.join(process.cwd(), 'tmp', 'uploads');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
      }),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    })
  )
  async uploadVideo(
    @Body('runId') runId: string,
    @Body('cypressId') cypressId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!runId || !cypressId || !file) {
      throw new BadRequestException('Missing required fields: runId, cypressId, file');
    }

    try {
      const result = await this.reporterService.uploadVideo(
        Number(runId),
        cypressId,
        file.path
      );
      return result;
    } finally {
      // Limpiar archivo temporal siempre
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  @UseGuards(AuthGuard)
  @Get('status/:runId')
  status(@Param('runId') runId: string) {
    const parsed = Number(runId);
    if (isNaN(parsed)) {
      throw new BadRequestException('Invalid runId');
    }
    return this.reporterService.getSessionStatus(parsed);
  }
}
