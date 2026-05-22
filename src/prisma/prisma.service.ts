import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getMariaDbAdapter } from './prisma-adapter';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      adapter: getMariaDbAdapter(),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
