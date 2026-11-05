# MedFlow — Painel Operacional Hospitalar & Centro Cirúrgico

MedFlow é uma plataforma corporativa para gestão e coordenação de fluxo cirúrgico desenvolvida em **Angular 22**, combinando **Angular Signals**, **NgRx Global Store** (com `@ngrx/entity`) e **NgRx SignalStore**. O sistema centraliza o agendamento de procedimentos, a alocação de salas cirúrgicas, o ciclo de vida e esterilização de instrumentais cirúrgicos e a detecção em tempo real de conflitos operacionais.

---

## Funcionalidades Implementadas

### 1. Visão Geral Executiva (Overview)
- **Métricas Operacionais em Tempo Real:** Cards reativos com totais de procedimentos (agendados, em andamento, concluídos) e disponibilidade de caixas cirúrgicas.
- **Gráficos Donut SVG Nativos:** Visualização da distribuição de procedimentos e instrumentais com legendas interativas e suporte a acessibilidade (tabela semântica oculta para leitores de tela).
- **Tabela de Procedimentos Recentes:** Listagem rápida com status dinâmicos e navegação direta para detalhes.

### 2. Worklist Cirúrgica Avançada (Procedures)
- **Filtros e Busca em Tempo Real:** Pesquisa textual (código e título) com debounce e filtro por status, ambos sincronizados bidirecionalmente via Query Parameters na URL.
- **Ordenação e Paginação:** Integração com `MatSort` e `MatPaginator` sobre entidades gerenciadas pelo `@ngrx/entity`.
- **Exportação de Dados:** Exportação da listagem filtrada para arquivo `.csv`.
- **Gestão de Transições de Estado:** Diálogo modal (`MatDialog`) seguro para transição de status de procedimentos (`planned` → `in-progress` → `completed` ou `cancelled`) com confirmação de cancelamento.

### 3. Rastreamento de Instrumentais Cirúrgicos (Instruments)
- **Gerenciamento de Ciclo de Vida:** Controle de status (`available` ⇄ `reserved` ⇄ `in-use` → `cleaning` → `available` / `maintenance`) e localização física dos conjuntos.
- **Arquitetura de Estado:** Estado local/compartilhado gerenciado via `@ngrx/signals` (`InstrumentsStore`) com busca, filtragem e atualização reativa.

### 4. Agenda do Bloco Cirúrgico (Operating Room Schedule)
- **Grade Temporal de 24 Horas:** Visualização das 6 salas cirúrgicas (OR-1 a OR-6) em linha do tempo com blocos posicionados dinamicamente baseados no horário de início e duração estimada.
- **Linha "Agora" (Now Line):** Marcador vertical em tempo real indicando a hora atual na linha do tempo.
- **Interatividade Acessível:** Blocos operacionais clicáveis e navegáveis via teclado para consulta rápida.

### 5. Motor de Conflitos e Centro de Alertas
- **Detecção Operacional Pura:** Regras de negócio puras que identificam procedimentos sobrepostos na mesma sala cirúrgica ou no mesmo intervalo de tempo.
- **Centro de Notificações:** Menu dropdown na barra superior com badge numérico de alertas ativos e lista discriminada por severidade (aviso / crítico).

### 6. Página de Detalhes do Procedimento (Deep Linking)
- **Roteamento com Binding de Parâmetros:** Rota `/procedures/:id` utilizando `withComponentInputBinding()`.
- **Abas Informativas:** Navegação em abas (`MatTabGroup`) separando visão geral clínica, alocação de instrumentais cirúrgicos e histórico de auditoria.

### 7. Trilha de Auditoria & Activity Feed
- **Store de Atividades:** Registro de histórico com `ActivityStore`.
- **Auditoria Automática via NgRx Effects:** Ações de transição de status disparam automaticamente o registro de log com timestamp, usuário e alteração realizada.

### 8. Design System e Dark Mode
- **Design Tokens Corporativos:** Variáveis CSS e paletas do Angular Material 3 com suporte a temas Claro e Escuro.
- **Alternador de Tema na Toolbar:** Persistência automática da preferência no `localStorage`.
- **Compatibilidade com CDK Overlays:** Estilização escura de alto contraste para modais (`MatDialog`), menus (`MatMenu`) e badges (`MatBadge`) conforme WCAG 2.1 AA.

---

## Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| **Framework** | Angular 22 (Standalone Components, Zoneless Ready, Sintaxe de Controle Moderno `@if` / `@for`) |
| **Linguagem** | TypeScript 5.x (Strict Mode habilitado) |
| **Estado Global** | `@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`, `@ngrx/store-devtools` |
| **Estado de Feature** | `@ngrx/signals` (NgRx SignalStore com `withEntities`) |
| **Reatividade** | Angular Signals (`signal`, `computed`, `effect`) e RxJS (`toSignal`, `Subject`, `debounceTime`) |
| **Interface & Design** | Angular Material 3, Angular CDK, Sass (SCSS) |
| **Testes Unitários** | Vitest via `@angular/build:unit-test` |
| **Testes End-to-End** | Playwright Test |

---

## Estrutura do Projeto

```text
src/app/
├── core/
│   ├── data/                 # Base de dados sintética determinística
│   ├── domain/               # Motores puros de regras de negócio (conflitos operacionais)
│   ├── models/               # Tipos TypeScript, interfaces de domínio e máquinas de estado
│   ├── services/             # Serviços (procedimentos, instrumentais, conflitos, tema)
│   └── store/                # NgRx Store global (procedimentos, facades, effects, activity)
├── features/
│   ├── overview/             # Dashboard executivo com KPIs e gráficos interativos
│   ├── procedures/           # Worklist, página de detalhes e modal de transição
│   ├── instruments/          # Rastreamento de caixas cirúrgicas via SignalStore
│   └── schedule/             # Agenda 24h das salas cirúrgicas
└── shared/
    └── components/           # Componentes reutilizáveis (DonutChart, StatusBadge, AlertCenter)
```

---

## Como Executar o Projeto

### Pré-requisitos
- Node.js `20.x` ou `22.x`
- npm `10.x` ou superior

### Instalação
```bash
git clone https://github.com/your-username/medflow.git
cd medflow
npm install
```

### Servidor de Desenvolvimento
```bash
npm start
```
Acesse `http://localhost:4200/` no navegador. A aplicação recarregará automaticamente com qualquer alteração salva.

### Build de Produção
```bash
npm run build
```
Os artefatos otimizados serão gerados no diretório `dist/medflow`.

### Execução de Testes

#### Testes Unitários (Vitest)
```bash
npm test -- --no-watch
```

#### Testes End-to-End (Playwright)
```bash
# Execução headless
npm run test:e2e

# Execução com interface interativa
npm run test:e2e:ui
```

---

## Melhorias Futuras Previstas

- [ ] **Camada HTTP Abstrata e Injeção de Dependência:** Desacoplamento completo dos serviços de dados utilizando `InjectionToken` (`PROCEDURE_API_TOKEN`, `INSTRUMENT_API_TOKEN`) para alternância entre dados locais e API remota.
- [ ] **Interceptors e Resiliência de Rede:** Adição de interceptor HTTP para captura global de falhas, tratamento de retry e feedback visual via `MatSnackBar`.
- [ ] **Modo Zoneless Completo:** Habilitação nativa de `provideZonelessChangeDetection()` sem dependência do Zone.js.
- [ ] **Carregamento Otimizado com `@defer`:** Uso de blocos de carregamento postergado (`@defer (on viewport)`) em gráficos e seções mais pesadas da página inicial.
- [ ] **Command Palette (`Ctrl + K`):** Barra de comando rápido e busca global suspensa via CDK Overlay.
- [ ] **Suporte a Múltiplos Idiomas (i18n):** Internacionalização com dicionários em Português (`pt-BR`) e Inglês (`en-US`).
- [ ] **Simulação de Atualizações em Tempo Real:** Conexão com eventos via WebSocket ou Server-Sent Events para refletir alterações remotas instantaneamente.
- [ ] **Controle de Acesso Baseado em Perfis (RBAC):** Proteção de rotas com guards (`CanMatchFn`) e diretivas condicionais para ações clínicas sensíveis.
- [ ] **Backend Dedicado:** Serviço de API em FastAPI (Python) com banco de dados relacional e persistência real.
- [ ] **Empacotamento e Implantação Contínua:** Configuração de contêineres Docker e pipeline de CI/CD para automação de testes e deploy.
