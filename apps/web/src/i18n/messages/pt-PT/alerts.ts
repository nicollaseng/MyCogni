import type { AlertsMessages } from '../pt-BR/alerts'

export const alerts: AlertsMessages = {
  meta: { title: 'Alertas' },
  title: 'Alertas',
  description:
    'Situações que pedem a sua atenção. Os urgentes também chegam por email, sem detalhes clínicos.',
  levels: { urgent: 'Urgente', watch: 'Atenção', info: 'Informativo' },
  statuses: { open: 'Novo', acknowledged: 'Visto', resolved: 'Resolvido' },
  reasons: {
    risk_item: 'Item 9 do PHQ-9 positivo',
    summary_urgent: 'Resumo semanal pede atenção urgente',
    severe_screening: 'Questionário com resultado grave',
    summary_watch: 'Resumo semanal sugere acompanhar',
    low_mood: 'Humor baixo na semana',
    mood_drop: 'Descida do humor na semana',
    inactive: 'Sem registos há 7+ dias',
    note_risk: 'Nota com sinal de risco',
    note_concern: 'Nota que pede atenção',
  },
  search: 'Pesquisar alerta',
  searchPlaceholder: 'Pesquisar por paciente',
  levelFilter: 'Filtrar por nível',
  statusFilter: 'Filtrar por estado',
  levelFilters: {
    all: 'Todos os níveis',
    urgent: 'Urgentes',
    watch: 'Atenção',
    info: 'Informativos',
  },
  statusFilters: {
    pending: 'Pendentes',
    open: 'Novos',
    acknowledged: 'Vistos',
    resolved: 'Resolvidos',
    all: 'Todos',
  },
  columns: {
    patient: 'Paciente',
    reason: 'Motivo',
    level: 'Nível',
    createdAt: 'Quando',
    status: 'Estado',
    actions: 'Ações',
  },
  results: '{count, plural, =0 {Nenhum alerta} one {# alerta} other {# alertas}}',
  empty: 'Ainda não há alertas. Quando algo pedir a sua atenção, aparece nesta lista.',
  noResults: 'Nenhum alerta corresponde aos filtros.',
  clear: 'Limpar filtros',
  unnamed: 'Paciente sem nome',
  acknowledge: 'Marcar como visto',
  resolve: 'Resolver',
  acknowledgeLabel: 'Marcar como visto: {reason}, {name}',
  resolveLabel: 'Resolver: {reason}, {name}',
  recordLabel: 'Abrir o registo: {reason}, {name}',
  acknowledged: 'Alerta marcado como visto.',
  resolved: 'Alerta resolvido.',
  error: 'Não foi possível atualizar o alerta agora. Tente novamente dentro de instantes.',
  navigation: {
    pending:
      '{count, plural, =0 {nenhum alerta pendente} one {# alerta pendente} other {# alertas pendentes}}',
  },
  kpis: {
    label: 'Alertas pendentes',
    urgent: '{count, plural, =0 {Nenhum urgente} one {# urgente} other {# urgentes}}',
    calm: 'Nenhum alerta pendente',
  },
  overview: {
    title: 'Alertas pendentes',
    seeAll: 'Ver todos os alertas ({count})',
    empty: 'Nenhum alerta pendente neste momento.',
  },
  patient: {
    title: 'Alertas pendentes',
    description:
      'Ao resolver, o alerta sai desta lista. Se a situação voltar a acontecer, é aberto um novo alerta.',
    all: 'Ver todos os alertas',
  },
}
