import type { UpdateJournalEntryInput } from '@mycogni/contracts'

export function promptPage(prompt: string): UpdateJournalEntryInput {
  return {
    title: null,
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: prompt, marks: [{ type: 'italic' }] }],
        },
        { type: 'paragraph' },
      ],
    },
    plainText: prompt,
    imagePaths: [],
  }
}
