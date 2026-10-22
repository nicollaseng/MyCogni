import { act } from '@testing-library/react'

export interface FakeViewport {
  move: (box: { height: number; offsetTop?: number }) => void
  showKeyboard: (height: number) => void
  hideKeyboard: () => void
  remove: () => void
}

export function installVisualViewport(): FakeViewport {
  const viewport = new EventTarget()
  let height = window.innerHeight
  let offsetTop = 0
  Object.defineProperties(viewport, {
    height: { get: () => height },
    offsetTop: { get: () => offsetTop },
  })
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })

  function move(box: { height: number; offsetTop?: number }) {
    height = box.height
    offsetTop = box.offsetTop ?? 0
    act(() => {
      viewport.dispatchEvent(new Event('resize'))
    })
  }

  return {
    move,
    showKeyboard: (keyboard) => {
      move({ height: window.innerHeight - keyboard })
    },
    hideKeyboard: () => {
      move({ height: window.innerHeight })
    },
    remove: () => {
      Reflect.deleteProperty(window, 'visualViewport')
    },
  }
}
