interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md space-y-2 py-16 text-center">
      <p className="font-medium text-pretty text-foreground">{title}</p>
      <p className="text-pretty text-muted-foreground">{description}</p>
    </div>
  )
}
