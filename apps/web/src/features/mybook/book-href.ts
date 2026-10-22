import { listPageQuery, withQuery, type ListPage } from '@/shared/lib/list-page'

export function bookHref(q: string, listPage: ListPage): '/mybook' | `/mybook?${string}` {
  return withQuery('/mybook', { ...(q === '' ? {} : { q }), ...listPageQuery(listPage) })
}
