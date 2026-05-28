import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { unwrapData, wrapData, wrapList } from '../common/payload.util';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Query() query: Record<string, unknown>) {
    const data = await this.categoriesService.findAll(query);
    return wrapList(data);
  }

  @Get(':documentId')
  async findOne(@Param('documentId') documentId: string) {
    const data = await this.categoriesService.findOne(documentId);
    return wrapData(data);
  }

  @Post()
  async create(@Body() body: { data?: CreateCategoryDto } | CreateCategoryDto) {
    const payload = unwrapData(body);
    const data = await this.categoriesService.create(payload);
    return wrapData(data);
  }

  @Put(':documentId')
  async update(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdateCategoryDto } | UpdateCategoryDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.categoriesService.update(documentId, payload);
    return wrapData(data);
  }

  @Patch(':documentId')
  async patch(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdateCategoryDto } | UpdateCategoryDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.categoriesService.update(documentId, payload);
    return wrapData(data);
  }

  @Delete(':documentId')
  async remove(@Param('documentId') documentId: string) {
    const data = await this.categoriesService.remove(documentId);
    return wrapData(data);
  }
}
