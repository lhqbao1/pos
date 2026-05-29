import { Injectable, NotFoundException } from '@nestjs/common';
import { getPagination } from '../common/query.util';
import { pickRelationRef } from '../common/ref.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Injectable()
export class OrderItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>) {
    const { skip, take } = getPagination(query);

    return this.prisma.orderItem.findMany({
      skip,
      take,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        dish: true,
        order: {
          include: {
            table: true,
          },
        },
      },
    });
  }

  async findOne(documentId: string) {
    const item = await this.prisma.orderItem.findUnique({
      where: { documentId },
      include: {
        dish: true,
        order: {
          include: {
            table: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    return item;
  }

  async create(input: CreateOrderItemDto) {
    const [orderId, dishId] = await Promise.all([
      this.resolveOrderId(input),
      this.resolveDishId(input),
    ]);

    if (!orderId) {
      throw new NotFoundException('Order reference not found');
    }

    if (!dishId) {
      throw new NotFoundException('Dish reference not found');
    }

    const dish = await this.prisma.dish.findUnique({
      where: { id: dishId },
      select: { name: true, sku: true },
    });

    return this.prisma.orderItem.create({
      data: {
        orderId,
        dishId,
        quantity: input.quantity,
        priceAtOrder: input.priceAtOrder,
        lineTotal: input.lineTotal ?? input.quantity * input.priceAtOrder,
        discountAmount: input.discountAmount,
        dishNameSnapshot: input.dishNameSnapshot ?? dish?.name,
        dishSkuSnapshot: input.dishSkuSnapshot ?? dish?.sku,
        note: input.note,
        kitchenStatus: input.kitchenStatus,
      },
      include: {
        dish: true,
        order: {
          include: {
            table: true,
          },
        },
      },
    });
  }

  async update(documentId: string, input: UpdateOrderItemDto) {
    await this.ensureExists(documentId);

    const [orderId, dishId] = await Promise.all([
      this.resolveOrderId(input, true),
      this.resolveDishId(input, true),
    ]);

    const computedLineTotal =
      input.lineTotal ??
      (input.quantity !== undefined && input.priceAtOrder !== undefined
        ? input.quantity * input.priceAtOrder
        : undefined);

    return this.prisma.orderItem.update({
      where: { documentId },
      data: {
        orderId: orderId ?? undefined,
        dishId: dishId ?? undefined,
        quantity: input.quantity,
        priceAtOrder: input.priceAtOrder,
        lineTotal: computedLineTotal,
        discountAmount: input.discountAmount,
        dishNameSnapshot: input.dishNameSnapshot,
        dishSkuSnapshot: input.dishSkuSnapshot,
        note: input.note,
        kitchenStatus: input.kitchenStatus,
      },
      include: {
        dish: true,
        order: {
          include: {
            table: true,
          },
        },
      },
    });
  }

  async remove(documentId: string) {
    await this.ensureExists(documentId);

    return this.prisma.orderItem.delete({
      where: { documentId },
    });
  }

  private async resolveOrderId(
    input: Pick<CreateOrderItemDto, 'order' | 'orderId' | 'orderDocumentId'>,
    allowUndefined = false,
  ) {
    const ref = pickRelationRef(input.orderDocumentId ?? input.orderId ?? input.order);
    if (ref === undefined) {
      return allowUndefined ? undefined : null;
    }

    return this.resolveOrderRef(ref);
  }

  private async resolveDishId(
    input: Pick<CreateOrderItemDto, 'dish' | 'dishId' | 'dishDocumentId'>,
    allowUndefined = false,
  ) {
    const ref = pickRelationRef(input.dishDocumentId ?? input.dishId ?? input.dish);
    if (ref === undefined) {
      return allowUndefined ? undefined : null;
    }

    return this.resolveDishRef(ref);
  }

  private async resolveOrderRef(ref: string | number) {
    if (typeof ref === 'number') {
      const order = await this.prisma.order.findUnique({ where: { id: ref }, select: { id: true } });
      return order?.id ?? null;
    }

    const numeric = Number(ref);
    if (Number.isInteger(numeric) && `${numeric}` === ref) {
      const byId = await this.prisma.order.findUnique({ where: { id: numeric }, select: { id: true } });
      if (byId) {
        return byId.id;
      }
    }

    const byDocumentId = await this.prisma.order.findUnique({
      where: { documentId: ref },
      select: { id: true },
    });

    return byDocumentId?.id ?? null;
  }

  private async resolveDishRef(ref: string | number) {
    if (typeof ref === 'number') {
      const dish = await this.prisma.dish.findUnique({ where: { id: ref }, select: { id: true } });
      return dish?.id ?? null;
    }

    const numeric = Number(ref);
    if (Number.isInteger(numeric) && `${numeric}` === ref) {
      const byId = await this.prisma.dish.findUnique({ where: { id: numeric }, select: { id: true } });
      if (byId) {
        return byId.id;
      }
    }

    const byDocumentId = await this.prisma.dish.findUnique({
      where: { documentId: ref },
      select: { id: true },
    });

    return byDocumentId?.id ?? null;
  }

  private async ensureExists(documentId: string) {
    const record = await this.prisma.orderItem.findUnique({
      where: { documentId },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException('Order item not found');
    }
  }
}
