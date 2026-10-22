import { assignments as american } from '../en-US/assignments'
import type { AssignmentsMessages } from '../pt-BR/assignments'

export const assignments: AssignmentsMessages = {
  ...american,
  areas: { ...american.areas, anxiety: 'Generalised anxiety' },
}
