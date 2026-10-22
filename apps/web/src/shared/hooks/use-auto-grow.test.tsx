import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { useAutoGrow } from './use-auto-grow'

function Field({ value }: { value: string }) {
  const field = useAutoGrow(value)
  return <textarea ref={field} aria-label="Nota" value={value} readOnly />
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('useAutoGrow', () => {
  it('sets the field height to its content and follows it as the text grows', () => {
    const contentHeight = jest
      .spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(78)
    const { rerender } = render(<Field value="uma linha" />)
    expect(screen.getByLabelText('Nota')).toHaveStyle({ height: '78px' })

    contentHeight.mockReturnValue(156)
    rerender(<Field value={'uma linha\noutra\nmais uma\ne outra'} />)
    expect(screen.getByLabelText('Nota')).toHaveStyle({ height: '156px' })
  })
})
