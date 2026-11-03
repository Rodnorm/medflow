# MedFlow — Product Requirements Document

**Versão:** 1.0 (MVP demonstrativo)  
**Data:** 2026-11-02  
**Status:** Proposto para implementação  
**Público:** Desenvolvedor, revisores técnicos e agentes de IA  

## 1. Visão do produto

MedFlow é um dashboard demonstrativo de operações hospitalares, construído para exercitar Angular moderno e arquitetura frontend empresarial. Coordena **procedimentos planejados** e a **disponibilidade de conjuntos de instrumentos** através de um fluxo operacional fictício. Não faz diagnóstico, não recomenda tratamentos, não gerencia pacientes reais e não deve ser usado em serviços de saúde.

### 1.1 Problema

Equipes operacionais precisam identificar procedimentos pendentes, entender quais conjuntos de instrumentos estão disponíveis e acompanhar estados sem consultar diversas telas ou planilhas.

### 1.2 Objetivos

- Apresentar um painel operacional compreensível em menos de 30 segundos.
- Permitir buscar, filtrar e acompanhar procedimentos e conjuntos de instrumentos.
- Demonstrar regras de transição de status consistentes e auditáveis na interface.
- Servir como laboratório prático de Angular 22, Signals, RxJS, NgRx e Angular Material.
- Produzir um aplicativo publicável no portfólio e explicável numa entrevista técnica.

### 1.3 Fora do escopo

- Dados pessoais de pacientes, integração com hospitais, prontuários, diagnósticos e prescrições.
- Autenticação real, permissões corporativas e trilha de auditoria juridicamente válida.
- Estoque físico, esterilização real ou decisões de segurança clínica.
- Backend de produção, IA generativa, faturamento e notificações em tempo real.
- Garantia de conformidade regulatória ou uso clínico.

## 2. Usuários e cenários

**Coordenador operacional (persona fictícia):** consulta a fila de procedimentos, prioriza situações e identifica gargalos.  
**Responsável por instrumentos (persona fictícia):** acompanha disponibilidade e situação dos conjuntos de instrumentos.  
**Desenvolvedor de produto (persona técnica):** reutiliza componentes, regras de estado e contratos de API em novas features.

### 2.1 Jornada principal

1. Abrir a visão geral e verificar indicadores de procedimentos pendentes e instrumentos disponíveis.
2. Navegar até `Procedures`, filtrar por status e pesquisar pelo código do procedimento.
3. Abrir detalhes de um procedimento fictício, consultar o conjunto de instrumentos associado e avançar o status quando permitido.
4. Navegar até `Instruments`, identificar conjuntos disponíveis ou em manutenção e simular mudanças de estado permitidas.
5. Voltar à visão geral e observar indicadores atualizados.

## 3. Vocabulário de domínio

- **Procedure:** unidade de trabalho operacional agendada, sem dados clínicos.
- **Instrument Set:** conjunto fictício de instrumentos, identificado por código.
- **Status:** etapa atual de um fluxo, sujeita a transições válidas.
- **Activity Event:** registro demonstrativo de uma ação feita no app, sem função de auditoria regulamentar.

## 4. Funcionalidades e requisitos

### F01 — Shell, navegação e layout

**Prioridade:** P0  
**Objetivo:** estrutura de navegação consistente entre Overview, Procedures e Instruments.

**Requisitos:**
- Sidebar ou navegação responsiva com rotas `/overview`, `/procedures`, `/instruments`.
- Header com título da seção e identificação explícita de ambiente **DEMO — SYNTHETIC DATA**.
- Página 404 e rota raiz redirecionando para `/overview`.
- Navegação por teclado, foco visível, sem interações dependentes somente de cor.
- Carregamento sob demanda das features por lazy loading.

**Aceitação:** navegação entre três telas sem reload completo; layout funcional em larguras de 390 px e 1280 px; links operáveis por teclado.

### F02 — Operations Overview

**Prioridade:** P0  
**Objetivo:** permitir leitura rápida da situação operacional.

**Requisitos:**
- Cards: total de procedimentos; procedimentos `planned`; procedimentos `in-progress`; conjuntos `available`; conjuntos `maintenance`.
- Lista resumida com até cinco procedimentos recentes, incluindo código, descrição curta, data e status.
- Indicadores derivados de dados existentes, sem números hardcoded na UI.
- Estados visuais de loading, erro e ausência de dados.
- Links dos cards para listas filtradas quando aplicável.

**Aceitação:** alterar um procedimento ou instrumento atualiza indicadores após atualização bem-sucedida do estado; nenhum KPI contém contagem fixa.

### F03 — Procedure Worklist

**Prioridade:** P0  
**Objetivo:** explorar e acompanhar procedimentos fictícios.

**Requisitos:**
- Tabela Angular Material com colunas: código, título, data planejada, conjunto associado, status e ação.
- Busca por código ou título, case-insensitive e com debounce de 300 ms.
- Filtro de status: `all`, `planned`, `in-progress`, `completed`, `cancelled`.
- Ordenação por código e data; paginação de 10 registros.
- URL preserva filtros essenciais por query parameters (status e termo de busca).
- Abrir diálogo ou página de detalhes, contendo informações operacionais e ações permitidas.
- Loading, erro com botão Retry e empty state.

**Aceitação:** buscas rápidas exibem apenas a resposta da última consulta; filtros funcionam juntos; uma lista vazia mostra mensagem apropriada.

### F04 — Procedure Status Workflow

**Prioridade:** P0  
**Objetivo:** demonstrar regras explícitas e testáveis.

**Estados:** `planned`, `in-progress`, `completed`, `cancelled`.

**Transições permitidas:**
- `planned` → `in-progress` ou `cancelled`.
- `in-progress` → `completed`.
- `completed` e `cancelled` são estados finais no MVP.

**Regras:**
- Não permitir transição inválida nem mesmo se ação for chamada por código.
- Exibir confirmação antes de cancelar.
- Enquanto uma atualização estiver pendente, bloquear ações duplicadas.
- Erros retornados pela API não alteram permanentemente o estado local; informar usuário.
- Registrar um `Activity Event` demonstrativo quando a transição for confirmada pela API.

**Aceitação:** testes cobrem todas as transições válidas e pelo menos uma inválida; interface reflete erro sem status falso.

### F05 — Instrument Tracking

**Prioridade:** P0  
**Objetivo:** visualizar disponibilidade fictícia de conjuntos de instrumentos.

**Requisitos:**
- Lista de conjuntos com código, nome, localização fictícia, status e última atualização.
- Filtro por status e busca por código ou nome.
- Status: `available`, `reserved`, `in-use`, `cleaning`, `maintenance`.
- Transições de demonstração: `available` → `reserved` ou `maintenance`; `reserved` → `in-use` ou `available`; `in-use` → `cleaning`; `cleaning` → `available`; `maintenance` → `available`.
- Badge acessível com texto, não apenas cores.

**Aceitação:** mudanças inválidas são bloqueadas; métricas de Overview refletem status persistido pela mock API.

### F06 — Shared UI / Design System

**Prioridade:** P0  
**Objetivo:** criar componentes de apresentação reutilizáveis.

**Componentes mínimos:**
- `MetricCard`: título, valor, loading e link opcional.
- `StatusBadge`: status tipado, texto e estilo acessível.
- `EmptyState`: ícone opcional, mensagem, ação opcional.
- `ConfirmDialog`: título, explicação, cancelar e confirmar.
- `PageHeader`: título, subtítulo e slot para ações.

**Regras:** componentes de `shared/ui` não importam estado nem domínio de uma feature; composição baseada em inputs/outputs; estilos consistentes com Angular Material.

**Aceitação:** `MetricCard` e `StatusBadge` usados em pelo menos duas telas; documentação de inputs/outputs e testes unitários.

### F07 — API simulada e dados sintéticos

**Prioridade:** P0  
**Objetivo:** exercitar HTTP, erros e atualizações sem infraestrutura clínica.

**Contratos propostos:**
- `GET /api/procedures?search=&status=&page=&pageSize=&sort=` → lista paginada.
- `GET /api/procedures/:id` → detalhe.
- `PATCH /api/procedures/:id/status` → status atualizado ou erro.
- `GET /api/instruments?search=&status=` → lista.
- `PATCH /api/instruments/:id/status` → instrumento atualizado ou erro.
- `GET /api/overview` → resumo; ou indicadores derivados do estado carregado, escolha documentada em ADR.

**Requisitos:**
- Dados sintéticos determinísticos, pelo menos 30 procedimentos e 15 conjuntos de instrumentos.
- Atraso artificial configurável para demonstrar loading e cancelamento.
- Cenário controlado de falha para demonstrar tratamento de erros.
- Nenhuma informação pessoal real; nomes e códigos totalmente fictícios.
- Mesmo contrato TypeScript para mock API e futura API real.

**Aceitação:** a UI consome os serviços por `HttpClient`, não lê diretamente arquivos JSON nas páginas; falhas são visíveis e recuperáveis.

### F08 — Testes e acessibilidade

**Prioridade:** P0  
**Objetivo:** demonstrar práticas corporativas.

**Requisitos:**
- Vitest para funções de domínio, componentes e estado.
- Playwright para jornada principal e busca/filtros.
- Testar transições de estado válidas/inválidas, selectors e derived state.
- Navegação por teclado, foco visível e labels nos controles.
- Contraste e feedback textual para mensagens de erro/status.
- CI executando lint, typecheck, testes unitários e build, respeitando limites de conta gratuita.

**Aceitação:** testes e build verdes em ambiente limpo; fluxo Overview → Worklist → mudança de status → Overview coberto por E2E.

### F09 — Activity Feed (stretch goal)

**Prioridade:** P2  
**Objetivo:** exibir últimas ações simuladas.

**Requisitos:** exibir horário, entidade, status anterior e novo status; nenhuma alegação de auditoria regulatória; dados sintéticos.

### F10 — Dark mode e preferências (stretch goal)

**Prioridade:** P2  
**Objetivo:** demonstrar tematização e estado local persistido no navegador.

**Requisitos:** light/dark/system; preferência local; contraste mantido.

## 5. Estratégia de estado e aprendizado

A escolha de cada ferramenta deve ser intencional:

| Caso | Ferramenta | Justificativa |
|---|---|---|
| Termo de busca, estado do diálogo, seleção de aba | Angular Signals | Estado local síncrono |
| Contagens e listas derivadas | `computed()` ou NgRx selectors | Derivação rastreável e testável |
| Requisições de busca, debounce, cancelamento, erros | RxJS + HttpClient | Controle de streams assíncronos |
| Procedimentos e workflow compartilhados entre páginas | NgRx Store + Effects | Atualizações e ações rastreáveis |
| Instrumentos | NgRx SignalStore (exercício comparativo) | Estado delimitado por feature |

**Regra:** não duplicar o mesmo estado simultaneamente em duas stores. Registrar razões e trade-offs em `docs/adr/`.

## 6. Modelo inicial de dados

```ts
type ProcedureStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';
type InstrumentStatus = 'available' | 'reserved' | 'in-use' | 'cleaning' | 'maintenance';

interface Procedure {
  id: string;
  code: string;
  title: string;
  plannedAt: string; // ISO 8601
  status: ProcedureStatus;
  instrumentSetId: string | null;
  updatedAt: string;
}

interface InstrumentSet {
  id: string;
  code: string;
  name: string;
  location: string;
  status: InstrumentStatus;
  updatedAt: string;
}

interface ActivityEvent {
  id: string;
  entityType: 'procedure' | 'instrument';
  entityId: string;
  previousStatus: string;
  nextStatus: string;
  occurredAt: string;
}
```

Estes campos são uma proposta inicial e podem mudar por ADR antes de implementar cada feature.

## 7. Requisitos não funcionais

- **Manutenibilidade:** estrutura feature-first; boundaries documentadas; TypeScript strict.
- **Performance:** lazy loading por rota; evitar cálculos caros em templates; debounce no search.
- **Acessibilidade:** controles etiquetados, foco visível, teclado, estados comunicados em texto; buscar conformidade WCAG 2.2 AA onde aplicável, sem declarar certificação.
- **Resiliência:** loading, error, retry e empty states em telas com API.
- **Segurança de demonstração:** somente dados sintéticos; nenhuma informação de paciente real; sem segredos no repositório.
- **Observabilidade:** logs de erro locais suficientes para debugging; não coletar PII.
- **Dev experience:** scripts consistentes, README e checagens automatizadas essenciais.

## 8. Milestones e definição de pronto

### M1 — Foundation (segunda)
- Angular e Material configurados.
- Shell e lazy routes.
- `MetricCard` e `StatusBadge`.
- Primeiro uso de Signals.

### M2 — Procedures / RxJS (terça)
- Worklist funcional com busca, filtros, loading/erro.
- Contrato REST e dados sintéticos.

### M3 — NgRx / Workflows (quarta)
- Actions, reducer, selectors e effects para procedures.
- Instrument tracking com SignalStore.
- Regras de transição testadas.

### M4 — Quality (quinta)
- Vitest e Playwright cobrindo cenários centrais.
- Revisão de acessibilidade e arquitetura.

### M5 — Portfolio (sexta)
- README com screenshots, diagrama e ADRs.
- Deploy demonstrativo.
- Demonstração de 2–3 minutos e explicação técnica em inglês.

### Definição de pronto por feature
- Critérios de aceitação demonstrados.
- Código desenvolvido ou explicado pelo autor humano.
- Testes relevantes executados com sucesso.
- Estados de loading, erro e vazio considerados quando aplicável.
- Sem violação intencional de boundaries.
- Commit pequeno e descrição clara do que foi aprendido.

## 9. Política de colaboração com agentes

O programador humano implementa primeiro; agentes ensinam, revisam e fazem perguntas antes de oferecer código completo. Cada feature deve passar por: explicação → critérios de aceitação → implementação humana → testes → revisão → reflexão. Agentes não podem alterar arquivos, instalar pacotes, commitar ou fazer push sem autorização explícita.

## 10. Riscos, escolhas pendentes e limitações

- A amplitude do MVP pode exceder uma semana; **F01–F04, F06 e F08** devem prevalecer se o prazo apertar; F05 pode ficar como vertical slice simplificado.
- Confirmar versões compatíveis exatas de Angular, Material e NgRx no momento da instalação.
- Escolher mock REST (por exemplo, mock service worker ou servidor local pequeno), documentando como simular latência/erro.
- Precisar se as métricas vêm de `/api/overview` ou de estado local compartilhado; evitar divergência de contagens.
- Este sistema é somente uma simulação educacional, não software médico certificado.

## 11. Demonstração de aceite final

1. Abrir Overview com dados carregados.
2. Filtrar Procedure Worklist por status e digitar código rapidamente, demonstrando debounce/cancelamento.
3. Abrir uma procedure e fazer transição válida.
4. Tentar transição inválida e mostrar proteção.
5. Simular falha na API e demonstrar mensagem + retry.
6. Verificar KPI atualizado.
7. Executar testes e explicar por que Signals, RxJS e NgRx têm responsabilidades diferentes.

---