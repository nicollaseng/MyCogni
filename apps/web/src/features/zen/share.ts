export function whatsappHref(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function mailtoHref(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function articlePath(id: string): `/articles/${string}` {
  return `/articles/${id}`
}
