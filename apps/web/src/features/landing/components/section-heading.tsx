interface SectionHeadingProps {
  id: string
  kicker: string
  title: string
  description?: string
}

export function SectionHeading({ id, kicker, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground">{kicker}</p>
      <h2
        id={id}
        className="font-serif text-[36px] leading-[1.06] tracking-[-0.02em] text-balance sm:text-[44px]"
      >
        {title}
      </h2>
      {description !== undefined && (
        <p className="text-lg leading-relaxed text-pretty text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
