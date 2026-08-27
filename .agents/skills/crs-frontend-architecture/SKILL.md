---
name: crs-frontend-architecture
description: >-
  Consulte esta skill para obter o mapa completo de blueprints, serviços de API,
  rotas, permissões de acesso por perfil e componentes visuais do front-end do CRS.
---

# Mapa de Arquitetura e Navegação — CRS Frontend

Esta skill documenta a estrutura completa de telas, módulos, permissões e serviços do frontend do **Credit Risk System (CRS)**.

---

## 1. Catálogo de Blueprints e Módulos

O frontend possui 12 módulos/blueprints mapeados em `src/app.py`:

| Blueprint | Prefixo de Rota | Perfil de Acesso | Serviço Associado (`src/services/`) | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| **`login`** | `/login` | Público | `APILoginService` | Autenticação de usuários, sessão Flask-Login e logout. |
| **`grupos_economicos`** | `/grupos-economicos` | Não EXTERNO | `APIGruposEconomicosService` | **Padrão Ouro**. Cadastro, organograma, edição e exclusão de grupos e emissores. |
| **`solicitar_alcada`** | `/solicitar-alcada` | Não EXTERNO | `APISolicitarAlcadaService` | Iniciação de workflow de alçada de crédito por mesa/grupo. |
| **`consulta_solicitacoes`** | `/consulta-solicitacoes` | Não EXTERNO | `APIConsultarSolicitacaoService` | Consulta e cancelamento de solicitações de crédito pendentes. |
| **`consultar_limite`** | `/consultar-limite` | Não EXTERNO | `APIConsultarLimiteService` | Consulta de limites consolidados, ratings e vigências. |
| **`historico_casos`** | `/historico-casos` | Todos logados | `APIHistoricoCasosService` | Histórico completo de aprovações e decisões de comitê. |
| **`aprovar_limite`** | `/aprovar-limite` | Aprovadores | `APIAprovarLimiteService` | Painel de deliberação e votação de comitê de crédito. |
| **`alcadas_pendentes`** | `/alcadas-pendentes` | `ADMIN` | `APIAlcadasPendentesService` | Monitoramento executivo de solicitações em trânsito. |
| **`mapeamentos`** | `/mapeamentos` | `ADMIN` | `APIMapeamentosService` | De-para de Managers, produtos OC3 e ativos de consumo FIDC. |
| **`gestao_de_usuarios`** | `/gestao-de-usuarios` | `ADMIN` | `APIGestaoDeUsuariosService` | Cadastro, edição e atribuição de perfis/pesos a usuários. |
| **`monitor_tarefas`** | `/monitor-tarefas` | `ADMIN` | `APIMonitorTarefasService` | Painel de monitoramento de batches, jobs e travas no banco. |
| **`desenquadramentos`** | `/desenquadramentos` | `ADMIN` | `APIDesenquadramentosService` | Acompanhamento diário de excessos de limite e alertas. |

---

## 2. Controle de Acesso e Perfis

O perfil do usuário é injetado globalmente nos templates via context processor (`current_user.grupo`):

- **`ADMIN`**: Acesso total a todas as blueprints, incluindo a seção **Riscos** no menu lateral (`alcadas_pendentes`, `mapeamentos`, `gestao_de_usuarios`, `monitor_tarefas`, `desenquadramentos`).
- **Mesas Operacionais (ex: `Mesa 1`, `Mesa 2`)**: Acesso a **Solicitações e Cadastros** (`grupos_economicos`, `solicitar_alcada`, `consulta_solicitacoes`), **Consultar Limite** e **Histórico de Casos**.
- **`EXTERNO`**: Acesso restrito a relatórios e consultas gerais.

---

## 3. Padrão Visual e Tokens CSS Globais

O frontend utiliza o Bootstrap 5 customizado com as seguintes variáveis CSS definidas em `src/static/css/global.css`:
- `--color-accent`: Cor primária institucional de destaque (Laranja Itaú `#EC7000`).
- `--color-bg-main`: Fundo principal da aplicação (suporta light e dark theme).
- `--color-bg-card`: Fundo de cartões e formulários.
- `--color-text-main` / `--color-text-muted`: Tipografia de alta legibilidade.
- Tipografia: Famílias `ItauDisplay`, `OpenSans-Regular`, `Raleway-SemiBold`.
