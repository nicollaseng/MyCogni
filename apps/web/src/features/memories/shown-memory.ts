import type { Memory } from '@mycogni/contracts'

export interface ShownMemory {
  id: string
  content: string
  kind: Memory['kind']
  status: Memory['status']
  hint: string | null
}
