import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination } from '../common/query.util';
import { pickRelationRef } from '../common/ref.util';
import { slugify } from '../common/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

@Injectable()
export class DishesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>) {
    const search = this.getSearchTerm(query);
    const { skip, take } = getPagination(query);

    const where: Prisma.DishWhereInput | undefined = search
      ? {
          OR: [
            { name: { contains: search } },
            { slug: { contains: search } },
            { sku: { contains: search } },
          ],
        }
      : undefined;

    return this.prisma.dish.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { category: true },
    });
  }

  async findOne(documentId: string) {
    const dish = await this.prisma.dish.findUnique({
      where: { documentId },
      include: { category: true },
    });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    return dish;
  }

  async create(input: CreateDishDto) {
    const categoryId = await this.resolveCategoryId(input);

    return this.prisma.dish.create({
      data: {
        name: input.name,
        slug: input.slug || slugify(input.name),
        sku: input.sku,
        description: input.description,
        price: input.price,
        vipPrice: input.vipPrice,
        costPrice: input.costPrice,
        image: input.image,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        sold: input.sold,
        rating: input.rating,
        categoryId,
      },
      include: { category: true },
    });
  }

  async update(documentId: string, input: UpdateDishDto) {
    await this.ensureExists(documentId);
    const categoryId = await this.resolveCategoryId(input, true);

    return this.prisma.dish.update({
      where: { documentId },
      data: {
        name: input.name,
        slug: input.slug || (input.name ? slugify(input.name) : undefined),
        sku: input.sku,
        description: input.description,
        price: input.price,
        vipPrice: input.vipPrice,
        costPrice: input.costPrice,
        image: input.image,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        sold: input.sold,
        rating: input.rating,
        categoryId,
      },
      include: { category: true },
    });
  }

  async remove(documentId: string) {
    await this.ensureExists(documentId);

    return this.prisma.dish.delete({
      where: { documentId },
    });
  }

  private async resolveCategoryId(
    input: Pick<CreateDishDto, 'category' | 'categoryId' | 'categoryDocumentId'>,
    allowUndefined = false,
  ) {
    const ref = pickRelationRef(input.categoryDocumentId ?? input.categoryId ?? input.category);

    if (ref === undefined) {
      return allowUndefined ? undefined : null;
    }

    if (typeof ref === 'number') {
      const category = await this.prisma.category.findUnique({ where: { id: ref }, select: { id: true } });
      return category?.id ?? null;
    }

    const numeric = Number(ref);
    if (Number.isInteger(numeric) && `${numeric}` === ref) {
      const byId = await this.prisma.category.findUnique({ where: { id: numeric }, select: { id: true } });
      if (byId) {
        return byId.id;
      }
    }

    const byDocumentId = await this.prisma.category.findUnique({
      where: { documentId: ref },
      select: { id: true },
    });

    return byDocumentId?.id ?? null;
  }

  private async ensureExists(documentId: string) {
    const record = await this.prisma.dish.findUnique({
      where: { documentId },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException('Dish not found');
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
