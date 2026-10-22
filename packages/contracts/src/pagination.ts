import { defaultPageSize, maxPageSize } from '@mycogni/domain'
import { z } from 'zod'

export const pageQueryFields = {
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(maxPageSize).default(defaultPageSize),
}

export function pageSchemaOf<Item extends z.ZodType>(item: Item) {
  return z.object({
    items: z.array(item),
    total: z.int().min(0),
    page: z.int().min(1),
    size: z.int().min(1).max(maxPageSize),
  })
}
