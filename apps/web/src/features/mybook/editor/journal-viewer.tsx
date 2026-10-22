'use client'

import type { JournalNode } from '@mycogni/contracts'
import { EditorContent, useEditor } from '@tiptap/react'
import { useTranslations } from 'next-intl'
import { withImageSources } from '../document'
import { GalleryContext } from '../gallery/gallery-context'
import { PagePhotoViewer } from '../gallery/page-photo-viewer'
import { usePhotoViewing } from '../gallery/use-photo-viewing'
import { editorContentOf, journalExtensions } from './extensions'
import './journal.css'

interface JournalViewerProps {
  body: JournalNode
  imageUrls: Readonly<Record<string, string>>
}

export function JournalViewer({ body, imageUrls }: JournalViewerProps) {
  const t = useTranslations('mybook.editor')
  const photoViewing = usePhotoViewing()
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: journalExtensions({
      placeholder: '',
      task: (text) => (text === '' ? t('emptyTask') : t('task', { text })),
    }),
    content: editorContentOf(withImageSources(body, imageUrls)),
    editorProps: { attributes: { class: 'journal' } },
  })

  return (
    <>
      <GalleryContext value={photoViewing.actions}>
        <EditorContent editor={editor} />
      </GalleryContext>
      {photoViewing.viewing !== null && editor !== null && (
        <PagePhotoViewer
          editor={editor}
          start={photoViewing.viewing}
          owner={null}
          onClose={photoViewing.close}
        />
      )}
    </>
  )
}
