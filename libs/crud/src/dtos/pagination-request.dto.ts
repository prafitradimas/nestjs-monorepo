import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

export class PaginationRequestDTO {
  @ApiPropertyOptional({
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    default: 10,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page_size?: number;
}

export class SearchPaginationRequestDTO extends PaginationRequestDTO {
  @ApiPropertyOptional()
  @IsOptional()
  search?: string;
}
