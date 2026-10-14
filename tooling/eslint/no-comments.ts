import type { Rule } from 'eslint'

export const noComments: Rule.RuleModule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      forbidden: 'Comments are not allowed. Express intent through names and types.',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.loc) {
            context.report({ loc: comment.loc, messageId: 'forbidden' })
          }
        }
      },
    }
  },
}
