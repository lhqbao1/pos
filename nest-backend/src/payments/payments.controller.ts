import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { unwrapData, wrapData, wrapList } from '../common/payload.util';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(@Query() query: Record<string, unknown>) {
    const data = await this.paymentsService.findAll(query);
    return wrapList(data);
  }

  @Get(':documentId')
  async findOne(@Param('documentId') documentId: string) {
    const data = await this.paymentsService.findOne(documentId);
    return wrapData(data);
  }

  @Post()
  async create(@Body() body: { data?: CreatePaymentDto } | CreatePaymentDto) {
    const payload = unwrapData(body);
    const data = await this.paymentsService.create(payload);
    return wrapData(data);
  }

  @Put(':documentId')
  async update(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdatePaymentDto } | UpdatePaymentDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.paymentsService.update(documentId, payload);
    return wrapData(data);
  }

  @Patch(':documentId')
  async patch(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdatePaymentDto } | UpdatePaymentDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.paymentsService.update(documentId, payload);
    return wrapData(data);
  }

  @Delete(':documentId')
  async remove(@Param('documentId') documentId: string) {
    const data = await this.paymentsService.remove(documentId);
    return wrapData(data);
  }
}
