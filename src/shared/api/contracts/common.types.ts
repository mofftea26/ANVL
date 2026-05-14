/**
 * Shared HTTP API shapes for future ANVL backends (CMS + commerce + auth).
 */

export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation_error'
  | 'rate_limited'
  | 'internal_error'
  | 'service_unavailable'

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode | string
    message: string
    details?: Record<string, string[] | string | undefined>
    requestId?: string
  }
}

export type SortDirection = 'asc' | 'desc'

export type ListSort<Field extends string = string> = {
  field: Field
  direction: SortDirection
}

export type OffsetPaginationQuery = {
  page?: number
  pageSize?: number
}

export type OffsetPaginatedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type CursorPaginationQuery = {
  cursor?: string | null
  limit?: number
}

export type CursorPaginatedResult<T> = {
  items: T[]
  nextCursor?: string | null
  hasMore: boolean
}

export type DateRangeFilter = {
  from?: string
  to?: string
}
