export function FormMessage({ error, notice }: { error: string | null; notice: string | null }) {
  if (error !== null) {
    return (
      <p role="alert" className="text-sm text-danger">
        {error}
      </p>
    )
  }
  if (notice !== null) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {notice}
      </p>
    )
  }
  return null
}
