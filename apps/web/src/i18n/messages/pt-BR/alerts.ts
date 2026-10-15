export const alerts = {
  meta: { title: 'Alertas' },
  title: 'Alertas',
  description:
    'Situações que pedem um olhar seu: respostas que indicam risco, resultados graves, piora do humor, resumos que pedem atenção e dias sem registros. Os urgentes também chegam por email, sem detalhes clínicos.',
  levels: { urgent: 'Urgente', watch: 'Atenção', info: 'Informativo' },
  statuses: { open: 'Novo', acknowledged: 'Visto', resolved: 'Resolvido' },
  reasons: {
    risk_item: 'Item 9 do PHQ-9 positivo',
    summary_urgent: 'Resumo semanal pede atenção urgente',
    severe_screening: 'Questionário com resultado grave',
    summary_watch: 'Resumo semanal sugere acompanhar',
    low_mood: 'Humor baixo na semana',
    mood_drop: 'Queda de humor na semana',
    inactive: 'Sem registros há 7+ dias',
  },
  search: 'Buscar alerta',
  searchPlaceholder: 'Buscar por paciente',
  levelFilter: 'Filtrar por nível',
  statusFilter: 'Filtrar por situação',
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
    status: 'Situação',
    actions: 'Ações',
  },
  results: '{count, plural, =0 {Nenhum alerta} one {# alerta} other {# alertas}}',
  empty: 'Nenhum alerta por aqui. Quando algo pedir sua atenção, ele aparece nesta lista.',
  noResults: 'Nenhum alerta corresponde aos filtros.',
  clear: 'Limpar filtros',
  unnamed: 'Paciente sem nome',
  acknowledge: 'Marcar como visto',
  resolve: 'Resolver',
  acknowledgeLabel: 'Marcar como visto: {reason}, {name}',
  resolveLabel: 'Resolver: {reason}, {name}',
  acknowledged: 'Alerta marcado como visto.',
  resolved: 'Alerta resolvido.',
  error: 'Não conseguimos atualizar o alerta agora. Tente de novo em instantes.',
  resolvedAt: 'Resolvido em {date}',
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
    empty: 'Nenhum alerta pendente agora.',
  },
  patient: {
    title: 'Alertas pendentes',
    description:
      'Ao resolver, o alerta sai desta lista. Se a situação voltar, um novo alerta é aberto.',
    all: 'Ver todos os alertas',
  },
}

export type AlertsMessages = typeof alerts
