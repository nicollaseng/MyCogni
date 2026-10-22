interface DatabaseFailure {
  code: unknown
  constraint: unknown
}

function failureOf(error: unknown): DatabaseFailure {
  const cause: unknown = error instanceof Error ? error.cause : undefined
  if (typeof cause !== 'object' || cause === null) {
    return { code: undefined, constraint: undefined }
  }
  return {
    code: 'code' in cause ? cause.code : undefined,
    constraint: 'constraint_name' in cause ? cause.constraint_name : undefined,
  }
}

export function isPolicyViolation(error: unknown): boolean {
  return failureOf(error).code === '42501'
}

export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const failure = failureOf(error)
  return failure.code === '23505' && (constraint === undefined || failure.constraint === constraint)
}
