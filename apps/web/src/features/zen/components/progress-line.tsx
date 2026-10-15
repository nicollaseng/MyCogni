interface ProgressLineProps {
  done: number
  total: number
}

export function ProgressLine({ done, total }: ProgressLineProps) {
  return (
    <div aria-hidden className="h-[2px] bg-rule">
      <div
        className="h-full bg-foreground transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width: `${String((done / total) * 100)}%` }}
      />
    </div>
  )
}
