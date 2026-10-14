interface PageTitleProps {
  title: string
  kicker?: string
  description?: string
  titleId?: string
}

export function PageTitle({ title, kicker, description, titleId }: PageTitleProps) {
  return (
    <header className="space-y-3">
      {kicker !== undefined && <p className="text-sm text-muted-foreground">{kicker}</p>}
      <h1
        id={titleId}
        className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-5xl"
      >
        {title}
      </h1>
      {description !== undefined && (
        <p className="max-w-[36rem] leading-relaxed text-muted-foreground">{description}</p>
      )}
    </header>
  )
}
