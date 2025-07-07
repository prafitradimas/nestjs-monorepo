import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationRequestDTO } from './pagination-request.dto';

class Pagination {
  @ApiProperty()
  total_entries: number;

  @ApiProperty()
  total_page: number;

  @ApiProperty()
  current_page: number;

  @ApiProperty()
  page_size: number;

  @ApiPropertyOptional()
  next_page: number | null;

  @ApiPropertyOptional()
  prev_page: number | null;

  constructor(data: { readonly [K in keyof Pagination]: Pagination[K] }) {
    Object.assign(this, data);
  }
}

export class PaginationResponseDTO<T> {
  @ApiProperty()
  result: T[];

  @ApiProperty()
  paginations: Pagination;

  constructor(
    request: PaginationRequestDTO,
    result: T[],
    totalEntries: number,
  ) {
    const page = request.page || 1;
    const pageSz = request.page_size || 10;

    this.result = result;
    this.paginations = new Pagination({
      total_entries: totalEntries,
      total_page: totalEntries > 0 ? 1 : 0,
      current_page: page,
      page_size: totalEntries > pageSz ? pageSz : totalEntries,
      next_page: null,
      prev_page: null,
    });

    if (
      totalEntries -
        this.paginations.current_page * this.paginations.page_size >
      1
    ) {
      this.paginations.next_page = this.paginations.current_page + 1;
    }

    if (this.paginations.current_page > 1) {
      this.paginations.prev_page = this.paginations.current_page - 1;
    }

    if (totalEntries > 0) {
      this.paginations.total_page = Math.ceil(
        totalEntries / this.paginations.page_size,
      );
    }
  }
}
