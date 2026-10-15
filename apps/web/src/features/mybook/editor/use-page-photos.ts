import type { JournalPhotoSize } from '@mycogni/domain'
import type { Node as DocumentNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'
import { useState } from 'react'
import { imageNodeName } from '../document'
import { insertPhoto } from './commands'
import type { PhotoTools } from './photo-canvas'
import {
  fitsInPage,
  photoProblem,
  preparePhoto,
  uploadPhoto,
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
  add: (photos: readonly ReadyPhoto[], size: JournalPhotoSize) => void
}

function imagesIn(doc: DocumentNode): number {
  let count = 0
  doc.descendants((node) => {
    if (node.type.name === imageNodeName) {
      count += 1
    }
  })
  return count
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
    if (!fitsInPage(imagesIn(editor.state.doc), files.length)) {
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

  async function addAll(photos: readonly ReadyPhoto[], size: JournalPhotoSize) {
    for (const photo of photos) {
      setUploads((count) => count + 1)
      const sent = await send(photo, size)
      setUploads((count) => count - 1)
      if (sent === null || editor === null) {
        setNotice('failed')
        continue
      }
      onUploaded(sent.path, sent.url)
      insertPhoto(editor, {
        path: sent.path,
        src: sent.url,
        width: sent.width,
        height: sent.height,
      })
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
