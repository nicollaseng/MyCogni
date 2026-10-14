import Link from 'next/link'
import type { ReactNode } from 'react'
import { Wordmark } from '@/shared/components/wordmark'
import { sectionLinks } from '../content'

const linkStyles = 'text-muted-foreground transition-colors hover:text-foreground'

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-medium">{title}</h2>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  )
}

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-rule py-14 text-sm">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs leading-relaxed text-muted-foreground">
            Diário de humor com PHQ-9, GAD-7 e resumos semanais escritos por IA.
          </p>
        </div>
        <FooterColumn title="Produto">
          {sectionLinks.map((link) => (
            <li key={link.id}>
              <a href={`/#${link.id}`} className={linkStyles}>
                {link.label}
              </a>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="Ajuda agora">
          <li>
            <a href="tel:188" className={linkStyles}>
              CVV · 188
            </a>
          </li>
          <li>
            <a href="tel:192" className={linkStyles}>
              SAMU · 192
            </a>
          </li>
        </FooterColumn>
        <FooterColumn title="Legal">
          <li>
            <Link href="/terms" className={linkStyles}>
              Termos de uso
            </Link>
          </li>
          <li>
            <Link href="/privacy" className={linkStyles}>
              Política de privacidade
            </Link>
          </li>
        </FooterColumn>
      </div>
      <div className="mt-12 flex flex-col gap-2 border-t border-rule pt-6 text-muted-foreground sm:flex-row sm:justify-between">
        <p>{`© ${String(year)} MyCogniAI. Feito no Brasil.`}</p>
        <p>Não é terapia nem diagnóstico. Em crise, ligue 188.</p>
      </div>
    </footer>
  )
}
