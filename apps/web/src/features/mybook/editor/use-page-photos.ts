import type { JournalPhotoSize } from '@mycogni/domain'
import type { Editor } from '@tiptap/react'
import { useState } from 'react'
import { insertPhotos, photoCountOf } from '../gallery/photo-commands'
import type { PhotoTools } from './photo-canvas'
import {
  fitsInPage,
  photoProblem,
  preparePhoto,
  uploadPhoto,
  type ComposedPhoto,
  type PhotoProblem,
  type ReadyPhoto,
} from './photos'

export interface ChosenPhoto {
  file: File
  preview: string
}

interface PagePhotosOptions {
  editor: Editor | null
  entryId: string
  tools: PhotoTools
  onUploaded: (path: string, url: string) => void
}

export interface PagePhotos {
  uploading: boolean
  notice: PhotoProblem | null
  dismissNotice: () => void
  choosing: readonly ChosenPhoto[] | null
  choose: (files: File[]) => void
  closeChooser: () => void
  add: (photos: readonly ComposedPhoto[], size: JournalPhotoSize) => void
}

export function usePagePhotos({
  editor,
  entryId,
  tools,
  onUploaded,
}: PagePhotosOptions): PagePhotos {
  const [uploads, setUploads] = useState(0)
  const [notice, setNotice] = useState<PhotoProblem | null>(null)
  const [choosing, setChoosing] = useState<readonly ChosenPhoto[] | null>(null)

  function choose(files: File[]) {
    if (editor === null) {
      return
    }
    setNotice(null)
    if (!fitsInPage(photoCountOf(editor.state.doc), files.length)) {
      setNotice('tooMany')
      return
    }
    const usable = files.filter((file) => photoProblem(file) === null)
    const problem = files.map(photoProblem).find((candidate) => candidate !== null)
    if (problem !== undefined) {
      setNotice(problem)
    }
    if (usable.length > 0) {
      setChoosing(usable.map((file) => ({ file, preview: URL.createObjectURL(file) })))
    }
  }

  function closeChooser() {
    for (const photo of choosing ?? []) {
      URL.revokeObjectURL(photo.preview)
    }
    setChoosing(null)
  }

  async function send(photo: ReadyPhoto, size: JournalPhotoSize) {
    try {
      const ready = await preparePhoto(photo, size, tools)
      const uploaded = await uploadPhoto(entryId, ready.file)
      return uploaded === null ? null : { ...uploaded, width: ready.width, height: ready.height }
    } catch {
      return null
    }
  }

  async function addAll(photos: readonly ComposedPhoto[], size: JournalPhotoSize) {
    for (const photo of photos) {
      setUploads((count) => count + 1)
      const sent = await send(photo, size)
      setUploads((count) => count - 1)
      if (sent === null || editor === null) {
        setNotice('failed')
        continue
      }
      onUploaded(sent.path, sent.url)
      insertPhotos(editor, [
        {
          path: sent.path,
          src: sent.url,
          width: sent.width,
          height: sent.height,
          caption: photo.caption,
        },
      ])
    }
  }

  return {
    uploading: uploads > 0,
    notice,
    dismissNotice: () => {
      setNotice(null)
    },
    choosing,
    choose,
    closeChooser,
    add: (photos, size) => {
      void addAll(photos, size)
    },
  }
}
