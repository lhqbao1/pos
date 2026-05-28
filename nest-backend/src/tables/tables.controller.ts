import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { unwrapData, wrapData, wrapList } from '../common/payload.util';
import { CreateTableDto } from './dto/create-table.dto';
import { TablesService } from './tables.service';
import { UpdateTableDto } from './dto/update-table.dto';

@Controller('api/tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  async findAll(@Query() query: Record<string, unknown>) {
    const data = await this.tablesService.findAll(query);
    return wrapList(data);
  }

  @Get(':documentId')
  async findOne(@Param('documentId') documentId: string) {
    const data = await this.tablesService.findOne(documentId);
    return wrapData(data);
  }

  @Post()
  async create(@Body() body: { data?: CreateTableDto } | CreateTableDto) {
    const payload = unwrapData(body);
    const data = await this.tablesService.create(payload);
    return wrapData(data);
  }

  @Put(':documentId')
  async update(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdateTableDto } | UpdateTableDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.tablesService.update(documentId, payload);
    return wrapData(data);
  }

  @Patch(':documentId')
  async patch(
    @Param('documentId') documentId: string,
    @Body() body: { data?: UpdateTableDto } | UpdateTableDto,
  ) {
    const payload = unwrapData(body);
    const data = await this.tablesService.update(documentId, payload);
    return wrapData(data);
  }

  @Delete(':documentId')
  async remove(@Param('documentId') documentId: string) {
    const data = await this.tablesService.remove(documentId);
    return wrapData(data);
  }
}
