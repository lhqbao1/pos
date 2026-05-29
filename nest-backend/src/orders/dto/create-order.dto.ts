import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RelationInput } from '../../common/ref.util';

export enum OrderStatusDto {
  empty = 'empty',
  active = 'active',
  paid = 'paid',
  outstanding = 'outstanding',
  cancelled = 'cancelled',
  refunded = 'refunded',
}

export enum OrderSourceDto {
  dine_in = 'dine_in',
  takeaway = 'takeaway',
  delivery = 'delivery',
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  table?: RelationInput;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tableId?: number;

  @IsOptional()
  @IsString()
  tableDocumentId?: string;

  @IsOptional()
  @IsEnum(OrderStatusDto)
  orderStatus?: OrderStatusDto;

  @IsOptional()
  @IsEnum(OrderSourceDto)
  source?: OrderSourceDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount?: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsDateString()
  openedAt?: string;

  @IsOptional()
  @IsDateString()
  paidTime?: string;

  @IsOptional()
  @IsDateString()
  closedAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  serviceCharge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  changeAmount?: number;

  @IsOptional()
  @IsString()
  cashierName?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
