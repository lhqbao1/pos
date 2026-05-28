import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination } from '../common/query.util';
import { pickRelationRef } from '../common/ref.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>) {
    const { skip, take } = getPagination(query);

    return this.prisma.order.findMany({
      skip,
      take,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        table: true,
        items: {
          include: {
            dish: true,
          },
        },
        payments: true,
      },
    });
  }

  async findOne(documentId: string) {
    const order = await this.prisma.order.findUnique({
      where: { documentId },
      include: {
        table: true,
        items: {
          include: {
            dish: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async create(input: CreateOrderDto) {
    const tableId = await this.resolveTableId(input);

    return this.prisma.order.create({
      data: {
        orderNo: input.orderNo,
        tableId,
        orderStatus: input.orderStatus,
        source: input.source,
        guestCount: input.guestCount,
        isPaid: input.isPaid,
        openedAt: toDate(input.openedAt),
        paidTime: toDate(input.paidTime),
        closedAt: toDate(input.closedAt),
        subtotal: input.subtotal,
        discountAmount: input.discountAmount,
        taxAmount: input.taxAmount,
        serviceCharge: input.serviceCharge,
        totalAmount: input.totalAmount,
        paidAmount: input.paidAmount,
        changeAmount: input.changeAmount,
        cashierName: input.cashierName,
        customerName: input.customerName,
        note: input.note,
      },
      include: {
        table: true,
        items: true,
        payments: true,
      },
    });
  }

  async update(documentId: string, input: UpdateOrderDto) {
    await this.ensureExists(documentId);
    const tableId = await this.resolveTableId(input, true);

    return this.prisma.order.update({
      where: { documentId },
      data: {
        orderNo: input.orderNo,
        tableId,
        orderStatus: input.orderStatus,
        source: input.source,
        guestCount: input.guestCount,
        isPaid: input.isPaid,
        openedAt: toDate(input.openedAt),
        paidTime: toDate(input.paidTime),
        closedAt: toDate(input.closedAt),
        subtotal: input.subtotal,
        discountAmount: input.discountAmount,
        taxAmount: input.taxAmount,
        serviceCharge: input.serviceCharge,
        totalAmount: input.totalAmount,
        paidAmount: input.paidAmount,
        changeAmount: input.changeAmount,
        cashierName: input.cashierName,
        customerName: input.customerName,
        note: input.note,
      },
      include: {
        table: true,
        items: true,
        payments: true,
      },
    });
  }

  async remove(documentId: string) {
    await this.ensureExists(documentId);

    return this.prisma.order.delete({
      where: { documentId },
    });
  }

  private async resolveTableId(
    input: Pick<CreateOrderDto, 'table' | 'tableId' | 'tableDocumentId'>,
    allowUndefined = false,
  ) {
    const ref = pickRelationRef(input.tableDocumentId ?? input.tableId ?? input.table);

    if (ref === undefined) {
      return allowUndefined ? undefined : null;
    }

    if (typeof ref === 'number') {
      const table = await this.prisma.table.findUnique({ where: { id: ref }, select: { id: true } });
      return table?.id ?? null;
    }

    const numeric = Number(ref);
    if (Number.isInteger(numeric) && `${numeric}` === ref) {
      const byId = await this.prisma.table.findUnique({ where: { id: numeric }, select: { id: true } });
      if (byId) {
        return byId.id;
      }
    }

    const byDocumentId = await this.prisma.table.findUnique({
      where: { documentId: ref },
      select: { id: true },
    });

    return byDocumentId?.id ?? null;
  }

  private async ensureExists(documentId: string) {
    const record = await this.prisma.order.findUnique({
      where: { documentId },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException('Order not found');
    }
  }
}

function toDate(value?: string) {
  if (!value) {
    return undefined;
  }

  return new Date(value);
}
