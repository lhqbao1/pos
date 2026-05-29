import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RelationInput } from '../../common/ref.util';

export enum KitchenStatusDto {
  pending = 'pending',
  preparing = 'preparing',
  served = 'served',
  cancelled = 'cancelled',
}

export class CreateOrderItemDto {
  @IsOptional()
  order?: RelationInput;

  @IsOptional()
  dish?: RelationInput;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dishId?: number;

  @IsOptional()
  @IsString()
  orderDocumentId?: string;

  @IsOptional()
  @IsString()
  dishDocumentId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceAtOrder!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lineTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  dishNameSnapshot?: string;

  @IsOptional()
  @IsString()
  dishSkuSnapshot?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(KitchenStatusDto)
  kitchenStatus?: KitchenStatusDto;
}
