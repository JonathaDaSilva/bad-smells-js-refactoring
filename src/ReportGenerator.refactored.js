const USER_VALUE_LIMIT = 500;
const PRIORITY_VALUE_THRESHOLD = 1000;

/**
 * Regras de visibilidade e prioridade por papel de usuário.
 * - Admins veem tudo e itens acima de PRIORITY_VALUE_THRESHOLD são prioritários.
 * - Users comuns só veem itens com valor <= USER_VALUE_LIMIT.
 */
const ROLE_POLICIES = {
  ADMIN: {
    canSee: () => true,
    isPriority: (item) => item.value > PRIORITY_VALUE_THRESHOLD,
  },
  USER: {
    canSee: (item) => item.value <= USER_VALUE_LIMIT,
    isPriority: () => false,
  },
};

const NO_ACCESS_POLICY = {
  canSee: () => false,
  isPriority: () => false,
};

/**
 * Formatadores por tipo de relatório (Replace Conditional with Polymorphism).
 * Cada um sabe montar seu cabeçalho, linha e rodapé.
 */
const FORMATTERS = {
  CSV: {
    header: () => 'ID,NOME,VALOR,USUARIO\n',
    row: (item, user) => `${item.id},${item.name},${item.value},${user.name}\n`,
    footer: (total) => `\nTotal,,\n${total},,\n`,
  },
  HTML: {
    header: (user) =>
      '<html><body>\n' +
      '<h1>Relatório</h1>\n' +
      `<h2>Usuário: ${user.name}</h2>\n` +
      '<table>\n' +
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
    row: (item, _user, isPriority) => {
      const style = isPriority ? ' style="font-weight:bold;"' : '';
      return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
    },
    footer: (total) => `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`,
  },
};

const NULL_FORMATTER = {
  header: () => '',
  row: () => '',
  footer: () => '',
};

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   */
  generateReport(reportType, user, items) {
    const formatter = FORMATTERS[reportType] ?? NULL_FORMATTER;
    const policy = ROLE_POLICIES[user.role] ?? NO_ACCESS_POLICY;
    const visibleItems = items.filter((item) => policy.canSee(item));

    const body = visibleItems
      .map((item) => formatter.row(item, user, policy.isPriority(item)))
      .join('');
    const total = sumValues(visibleItems);

    return (formatter.header(user) + body + formatter.footer(total)).trim();
  }
}

function sumValues(items) {
  return items.reduce((sum, item) => sum + item.value, 0);
}
