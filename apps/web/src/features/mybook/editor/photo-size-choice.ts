import { defaultJournalPhotoSize, isJournalPhotoSize, type JournalPhotoSize } from '@mycogni/domain'

export const photoSizeKey = 'mycogni.mybook.photoSize'

export function rememberedPhotoSize(): JournalPhotoSize {
  try {
    const stored = window.localStorage.getItem(photoSizeKey)
    return isJournalPhotoSize(stored) ? stored : defaultJournalPhotoSize
  } catch {
    return defaultJournalPhotoSize
  }
}

export function rememberPhotoSize(size: JournalPhotoSize): boolean {
  try {
    window.localStorage.setItem(photoSizeKey, size)
    return true
  } catch {
    return false
  }
}
