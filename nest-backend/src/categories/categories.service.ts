import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination } from '../common/query.util';
import { slugify } from '../common/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>) {
    const search = this.getSearchTerm(query);
    const { skip, take } = getPagination(query);

    const where: Prisma.CategoryWhereInput | undefined = search
      ? {
          OR: [
            { name: { contains: search } },
            { slug: { contains: search } },
          ],
        }
      : undefined;

    return this.prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        dishes: true,
      },
    });
  }

  async findOne(documentId: string) {
    const category = await this.prisma.category.findUnique({
      where: { documentId },
      include: { dishes: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(input: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...input,
        slug: input.slug || slugify(input.name),
      },
    });
  }

  async update(documentId: string, input: UpdateCategoryDto) {
    await this.ensureExists(documentId);

    return this.prisma.category.update({
      where: { documentId },
      data: {
        ...input,
        slug: input.slug || (input.name ? slugify(input.name) : undefined),
      },
    });
  }

  async remove(documentId: string) {
    await this.ensureExists(documentId);

    return this.prisma.category.delete({
      where: { documentId },
    });
  }

  private async ensureExists(documentId: string) {
    const record = await this.prisma.category.findUnique({
      where: { documentId },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException('Category not found');
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
