'use client'

import { NodeViewWrapper, useEditorState, type ReactNodeViewProps } from '@tiptap/react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { galleryPhotosOf, type GalleryPhoto } from '../document'
import { useGalleryActions } from './gallery-context'
import { pagePhotosOf } from './photo-commands'

const singleHeight = 320

const tileRatio = 4 / 5

interface TileProps {
  photo: GalleryPhoto
  label: string
  single: boolean
}

function ratioOf(photo: GalleryPhoto): number {
  return photo.width !== null && photo.height !== null ? photo.width / photo.height : tileRatio
}

function Tile({ photo, label, single }: TileProps) {
  const { open } = useGalleryActions()
  const ratio = ratioOf(photo)
  return (
    <button
      type="button"
      aria-label={label}
      data-photo-tile={photo.path ?? ''}
      disabled={photo.path === null}
      onClick={() => {
        if (photo.path !== null) {
          open(photo.path)
        }
      }}
      style={
        single
          ? { aspectRatio: String(ratio), width: `min(100%, ${String(singleHeight * ratio)}px)` }
          : undefined
      }
      className={cn(
        'relative block shrink-0 cursor-pointer overflow-hidden rounded-[8px] bg-surface',
        !single && 'aspect-[4/5] w-[calc((100%-0.75rem)/2.3)] snap-start sm:w-52',
      )}
    >
      {photo.src !== null && (
        <Image
          src={photo.src}
          alt=""
          fill
          unoptimized
          draggable={false}
          sizes="(min-width: 40rem) 13rem, 45vw"
          className="pointer-events-none object-cover"
        />
      )}
    </button>
  )
}

export function GalleryView({ node, editor, selected }: ReactNodeViewProps) {
  const t = useTranslations('mybook.gallery')
  const photos = galleryPhotosOf(node.attrs.photos)
  const order = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      pagePhotosOf(current.state.doc)
        .map((photo) => photo.path ?? '')
        .join('\n'),
  })
  const all = order.split('\n')

  function labelOf(photo: GalleryPhoto): string {
    const position = { index: all.indexOf(photo.path ?? '') + 1, total: all.length }
    return photo.caption === ''
      ? t('tile', position)
      : t('tileCaptioned', { ...position, caption: photo.caption })
  }

  const [first] = photos

  return (
    <NodeViewWrapper
      contentEditable={false}
      data-gallery=""
      className={cn(
        'journal-gallery rounded-[8px]',
        selected && 'ring-2 ring-emphasis ring-offset-2',
      )}
    >
      {photos.length === 1 && first !== undefined ? (
        <Tile photo={first} label={labelOf(first)} single />
      ) : (
        <div
          role="region"
          aria-label={t('region', { count: photos.length })}
          className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-1.5 overflow-x-auto overscroll-x-contain px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, index) => (
            <Tile
              key={`${photo.path ?? 'photo'}-${String(index)}`}
              photo={photo}
              label={labelOf(photo)}
              single={false}
            />
          ))}
        </div>
      )}
    </NodeViewWrapper>
  )
}
