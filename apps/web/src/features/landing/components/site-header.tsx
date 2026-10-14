import Link from 'next/link'
import { Wordmark } from '@/shared/components/wordmark'
import { buttonVariants } from '@/shared/ui/button'
import { sectionLinks } from '../content'

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-6 py-6">
      <Wordmark />
      <nav aria-label="Seções" className="hidden lg:block">
        <ul className="flex items-center gap-8 text-[15px] text-muted-foreground">
          {sectionLinks.map((link) => (
            <li key={link.id}>
              <a href={`/#${link.id}`} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <Link href="/today" className={buttonVariants({ size: 'sm', shape: 'pill' })}>
        Começar
      </Link>
    </header>
  )
}
