import { Controller, Get, Post, Body, Param, Delete, Patch, Query, ParseBoolPipe } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // --- AUTH ---
  @Post('auth/login')
  async login(@Body('email') email: string) {
    return this.appService.login(email);
  }

  // --- CUSTOMERS ---
  @Get('customers')
  async getCustomers() {
    return this.appService.getCustomers();
  }

  @Post('customers')
  async createCustomer(
    @Body()
    body: {
      email: string;
      name: string;
      phone?: string;
      rt?: string;
      desa?: string;
      blok?: string;
      status?: string;
      meterNo?: string;
    },
  ) {
    return this.appService.createCustomer(body);
  }

  @Delete('customers/:id')
  async deleteCustomer(@Param('id') id: string) {
    return this.appService.deleteCustomer(id);
  }

  // --- BILLS ---
  @Get('bills')
  async getBills(
    @Query('userId') userId?: string,
    @Query('year') year?: string,
  ) {
    return this.appService.getBills(userId, year);
  }

  @Post('bills')
  async createBill(
    @Body()
    body: {
      userId: string;
      monthString: string;
      yearString: string;
      meterStart: number;
      meterEnd: number;
    },
  ) {
    return this.appService.createBill(body);
  }

  // --- PAYMENTS ---
  @Get('payments')
  async getPayments(@Query('userId') userId?: string) {
    return this.appService.getPayments(userId);
  }

  @Post('payments')
  async createPayment(
    @Body()
    body: {
      billId: string;
      userId: string;
      amount: number;
      paymentMethod: string;
      proofOfImage?: string;
    },
  ) {
    return this.appService.createPayment(body);
  }

  @Patch('payments/:id/verify')
  async verifyPayment(
    @Param('id') id: string,
    @Body('approve') approve: boolean,
  ) {
    return this.appService.verifyPayment(id, approve);
  }

  // --- STATS ---
  @Get('stats')
  async getStats() {
    return this.appService.getStats();
  }
}
