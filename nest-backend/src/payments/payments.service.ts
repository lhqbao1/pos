import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination } from '../common/query.util';
import { pickRelationRef } from '../common/ref.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>) {
    const { skip, take } = getPagination(query);

    return this.prisma.payment.findMany({
      skip,
      take,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        order: true,
      },
    });
  }

  async findOne(documentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { documentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async create(input: CreatePaymentDto) {
    const orderId = await this.resolveOrderId(input);

    if (!orderId) {
      throw new NotFoundException('Order reference not found');
    }

    return this.prisma.payment.create({
      data: {
        orderId,
        method: input.method,
        status: input.status,
        amount: input.amount,
        currency: input.currency,
        paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
        reference: input.reference,
        note: input.note,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
      include: { order: true },
    });
  }

  async update(documentId: string, input: UpdatePaymentDto) {
    await this.ensureExists(documentId);
    const orderId = await this.resolveOrderId(input, true);

    return this.prisma.payment.update({
      where: { documentId },
      data: {
        orderId: orderId ?? undefined,
        method: input.method,
        status: input.status,
        amount: input.amount,
        currency: input.currency,
        paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
        reference: input.reference,
        note: input.note,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
      include: { order: true },
    });
  }

  async remove(documentId: string) {
    await this.ensureExists(documentId);

    return this.prisma.payment.delete({
      where: { documentId },
    });
  }

  private async resolveOrderId(
    input: Pick<CreatePaymentDto, 'order' | 'orderId' | 'orderDocumentId'>,
    allowUndefined = false,
  ) {
    const ref = pickRelationRef(input.orderDocumentId ?? input.orderId ?? input.order);

    if (ref === undefined) {
      return allowUndefined ? undefined : null;
    }

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

  private async ensureExists(documentId: string) {
    const record = await this.prisma.payment.findUnique({
      where: { documentId },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException('Payment not found');
    }
  }
}
