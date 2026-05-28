import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { unwrapData, wrapData, wrapList } from '../common/payload.util';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { DishesService } from './dishes.service';

@Controller('api/dishes')
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get()
  async findAll(@Query() query: Record<string, unknown>) {
    const data = await this.dishesService.findAll(query);
    return wrapList(data);
  }

  @Get(':documentId')
  async findOne(@Param('documentId') documentId: string) {
    const data = await this.dishesService.findOne(documentId);
    return wrapData(data);
  }

  @Post()
  async create(@Body() body: { data?: CreateDishDto } | CreateDishDto) {
    const payload = unwrapData(body);
    const data = await this.dishesService.create(payload);
    return wrapData(data);
  }

  @Put(':documentId')
  async update(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdateDishDto } | UpdateDishDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.dishesService.update(documentId, payload);
    return wrapData(data);
  }

  @Patch(':documentId')
  async patch(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdateDishDto } | UpdateDishDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.dishesService.update(documentId, payload);
    return wrapData(data);
  }

  @Delete(':documentId')
  async remove(@Param('documentId') documentId: string) {
    const data = await this.dishesService.remove(documentId);
    return wrapData(data);
  }
}
