export function ActionError({ error }: { error: string | null }) {
  if (error === null) {
    return null
  }
  return (
    <p role="alert" className="mb-3 text-sm text-danger">
      {error}
    </p>
  )
}
