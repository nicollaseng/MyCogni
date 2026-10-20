import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  contentLanguageOf,
  defaultLocale,
  isArticleId,
  isLocale,
  zenArticles,
} from '@mycogni/domain'
import { ImageResponse } from 'next/og'
import { articleImageSize } from '@/features/zen/article-metadata'
import { ArticleImage } from '@/features/zen/components/article-image'

const fontPath = join(process.cwd(), 'public/fonts/Newsreader-Display-Medium.ttf')

export async function GET(request: Request, { params }: RouteContext<'/articles/[id]/image'>) {
  const { id } = await params
  if (!isArticleId(id)) {
    return new Response(null, { status: 404 })
  }
  const requested = new URL(request.url).searchParams.get('lang')
  const locale = isLocale(requested) ? requested : defaultLocale
  const title = zenArticles[id].text[contentLanguageOf(locale)].title

  return new ImageResponse(<ArticleImage title={title} />, {
    ...articleImageSize,
    fonts: [{ name: 'Newsreader', data: await readFile(fontPath), weight: 500, style: 'normal' }],
  })
}
