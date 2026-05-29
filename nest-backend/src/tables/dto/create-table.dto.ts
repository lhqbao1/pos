import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum TableTypeDto {
  Normal = 'Normal',
  Vip = 'Vip',
}

export enum TableStatusDto {
  Empty = 'Empty',
  Using = 'Using',
  Reserved = 'Reserved',
  Cleaning = 'Cleaning',
  Disabled = 'Disabled',
}

export class CreateTableDto {
  @IsString()
  tableNumber!: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(TableTypeDto)
  type?: TableTypeDto;

  @IsOptional()
  @IsEnum(TableStatusDto)
  tableStatus?: TableStatusDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  occupiedSince?: string;

  @IsOptional()
  @IsDateString()
  lastClearedAt?: string;
}
