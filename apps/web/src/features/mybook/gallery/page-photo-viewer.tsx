'use client'

import { useEditorState, type Editor } from '@tiptap/react'
import { downloadPhoto, photoFileName } from './download'
import { pagePhotosOf, removePhoto, setPhotoCaption } from './photo-commands'
import { PhotoViewer, type ViewerActions, type ViewerPhoto } from './photo-viewer'

export interface PhotoOwner {
  writtenAt: Date
  timeZone: string
}

interface PagePhotoViewerProps {
  editor: Editor
  start: string
  owner: PhotoOwner | null
  onClose: (last: string | null) => void
}

function ownerActions(editor: Editor, owner: PhotoOwner): ViewerActions {
  return {
    download: (photo, index) =>
      photo.src === null
        ? Promise.resolve(false)
        : downloadPhoto(photo.src, (type) =>
            photoFileName(owner.writtenAt, owner.timeZone, index + 1, photo.key, type),
          ),
    saveCaption: (photo, caption) => Promise.resolve(setPhotoCaption(editor, photo.key, caption)),
    remove: (photo) => Promise.resolve(removePhoto(editor, photo.key)),
  }
}

export function PagePhotoViewer({ editor, start, owner, onClose }: PagePhotoViewerProps) {
  const photos = useEditorState({
    editor,
    selector: ({ editor: current }): ViewerPhoto[] =>
      pagePhotosOf(current.state.doc).flatMap((photo) =>
        photo.path === null ? [] : [{ key: photo.path, src: photo.src, caption: photo.caption }],
      ),
  })

  return (
    <PhotoViewer
      photos={photos}
      start={start}
      actions={owner === null ? null : ownerActions(editor, owner)}
      onClose={onClose}
    />
  )
}
