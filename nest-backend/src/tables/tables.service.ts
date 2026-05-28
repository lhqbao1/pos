import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination } from '../common/query.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>) {
    const search = this.getSearchTerm(query);
    const { skip, take } = getPagination(query);

    const where: Prisma.TableWhereInput | undefined = search
      ? {
          OR: [
            { tableNumber: { contains: search } },
            { displayName: { contains: search } },
            { zone: { contains: search } },
          ],
        }
      : undefined;

    return this.prisma.table.findMany({
      where,
      skip,
      take,
      orderBy: [{ tableNumber: 'asc' }],
      include: {
        orders: true,
      },
    });
  }

  async findOne(documentId: string) {
    const table = await this.prisma.table.findUnique({
      where: { documentId },
      include: { orders: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  async create(input: CreateTableDto) {
    return this.prisma.table.create({
      data: {
        ...input,
        occupiedSince: input.occupiedSince ? new Date(input.occupiedSince) : undefined,
        lastClearedAt: input.lastClearedAt ? new Date(input.lastClearedAt) : undefined,
      },
    });
  }

  async update(documentId: string, input: UpdateTableDto) {
    await this.ensureExists(documentId);

    return this.prisma.table.update({
      where: { documentId },
      data: {
        ...input,
        occupiedSince: input.occupiedSince ? new Date(input.occupiedSince) : undefined,
        lastClearedAt: input.lastClearedAt ? new Date(input.lastClearedAt) : undefined,
      },
    });
  }

  async remove(documentId: string) {
    await this.ensureExists(documentId);

    return this.prisma.table.delete({
      where: { documentId },
    });
  }

  private async ensureExists(documentId: string) {
    const record = await this.prisma.table.findUnique({
      where: { documentId },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException('Table not found');
    }
  }

  private getSearchTerm(query: Record<string, unknown>) {
    const search = query.search;
    const q = query.q;

    if (typeof search === 'string' && search.trim()) {
      return search.trim();
    }

    if (typeof q === 'string' && q.trim()) {
      return q.trim();
    }

    return undefined;
  }
}
