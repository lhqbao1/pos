import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RelationInput } from '../../common/ref.util';

export enum PaymentMethodDto {
  cash = 'cash',
  card = 'card',
  bank_transfer = 'bank_transfer',
  e_wallet = 'e_wallet',
}

export enum PaymentStatusDto {
  pending = 'pending',
  success = 'success',
  failed = 'failed',
  refunded = 'refunded',
}

export class CreatePaymentDto {
  @IsOptional()
  order?: RelationInput;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderId?: number;

  @IsOptional()
  @IsString()
  orderDocumentId?: string;

  @IsOptional()
  @IsEnum(PaymentMethodDto)
  method?: PaymentMethodDto;

  @IsOptional()
  @IsEnum(PaymentStatusDto)
  status?: PaymentStatusDto;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
