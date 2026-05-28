import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { unwrapData, wrapData, wrapList } from '../common/payload.util';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { OrderItemsService } from './order-items.service';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Controller('api/order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Get()
  async findAll(@Query() query: Record<string, unknown>) {
    const data = await this.orderItemsService.findAll(query);
    return wrapList(data);
  }

  @Get(':documentId')
  async findOne(@Param('documentId') documentId: string) {
    const data = await this.orderItemsService.findOne(documentId);
    return wrapData(data);
  }

  @Post()
  async create(@Body() body: { data?: CreateOrderItemDto } | CreateOrderItemDto) {
    const payload = unwrapData(body);
    const data = await this.orderItemsService.create(payload);
    return wrapData(data);
  }

  @Put(':documentId')
  async update(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdateOrderItemDto } | UpdateOrderItemDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.orderItemsService.update(documentId, payload);
    return wrapData(data);
  }

  @Patch(':documentId')
  async patch(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdateOrderItemDto } | UpdateOrderItemDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.orderItemsService.update(documentId, payload);
    return wrapData(data);
  }

  @Delete(':documentId')
  async remove(@Param('documentId') documentId: string) {
    const data = await this.orderItemsService.remove(documentId);
    return wrapData(data);
  }
}
