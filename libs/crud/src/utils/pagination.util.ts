import { PaginationRequestDTO } from '../dtos/pagination-request.dto';

export function getQueryPaginations<T extends PaginationRequestDTO>(
  request: T,
): { limit: number; offset: number; search?: string } {
  const offset = (request.page || 1) - 1;
  const limit = request.page_size || 10;

  if ('search' in request && typeof request.search === 'string') {
    return {
      limit: limit,
      offset: offset * limit,
      search: request.search,
    };
  }

  return {
    limit: limit,
    offset: offset * limit,
  };
}
