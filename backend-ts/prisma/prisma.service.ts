import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Force-load .env from backend-ts/.env
dotenv.config({
  path: path.resolve(__dirname, '..', '..', '.env'),
});

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  constructor() {
    super();

    console.log('>>> PrismaService constructor');
    console.log('>>> DATABASE_URL =', process.env.DATABASE_URL);
  }

  async onModuleInit() {
    console.log('>>> PrismaService initializing...');
    try {
      await this.$connect();
      console.log('>>> PrismaService connected successfully');
    } catch (err) {
      console.error('>>> PrismaService failed to connect');
      console.error(err);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
