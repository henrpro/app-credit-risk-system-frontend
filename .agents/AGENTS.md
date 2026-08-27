# Diretrizes e Identidade de Desenvolvimento — Credit Risk System (CRS Frontend)

Este documento define os princípios inegociáveis de engenharia de software, padrões estéticos de código e a identidade de desenvolvimento do projeto **Credit Risk System (CRS Frontend)**.

---

## 1. Princípios Fundamentais (Tolerância Zero)

- **Tolerância Zero a Código Desorganizado**: Código sem estrutura, com imports misturados, sem tratamento de exceção ou misturando responsabilidades de camadas não é aceito sob nenhuma hipótese.
- **Lógica Linear e Direta (Sem Funções Aninhadas)**: Proibido criar funções dentro de funções (`nested functions`/`closures` desnecessárias). O fluxo de execução de rotas e serviços deve ser estritamente linear, plano, claro e direto ao ponto.
- **Padrão Ouro — Blueprint `grupos_economicos`**: A blueprint `grupos_economicos` é a referência oficial de arquitetura e qualidade para todas as demais blueprints do frontend (estrutura de rotas, formulários, despacho por `action`, endpoints assíncronos `/api/...`, templates Jinja2 e modularização de assets CSS/JS).
- **Rigor na Arquitetura do Frontend**: A separação de responsabilidades deve ser seguida estritamente (`templates` -> `blueprints/<modulo>/routes.py` -> `services/api_<modulo>_service.py` -> Backend REST).
- **Consistência de Domínio e Nomenclatura**: Nomes de campos e parâmetros enviados e recebidos devem respeitar rigorosamente as convenções do SQL Server do CRS (`cd...`, `ds...`, `id...`, `vl...`, `dt...`, `ic...`).

---

## 2. Regra Visual e Estética de Importações (Pirâmide Invertida)

Os blocos de imports em todo o frontend Python devem ser estritamente divididos e ordenados em **ordem decrescente de tamanho da linha (número de caracteres)**:

```python
# Importações do projeto
from services.api_grupos_economicos_service import APIGruposEconomicosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user
```

> **Regras de Imports:**
> 1. Bloco `# Importações do projeto` sempre vem primeiro.
> 2. Bloco `# Importações de bibliotecas` sempre vem em seguida.
> 3. Em cada bloco, as linhas mais longas ficam no topo e as mais curtas na base (ordem decrescente de caracteres).

---

## 3. Divisores de Seção e Estilo Visual

Utilize separadores com sublinhados para delimitar seções lógicas nos arquivos:

```python
# ______________________________ Geral _______________________________________

# ______________________________ Cadastrar Grupo ______________________________

# ______________________________ Consultar Grupo ______________________________

# ______________________________ Alterar Grupo ______________________________

# ______________________________ Deletar Grupo ______________________________
```

Exemplos de divisores padrão:
- `src/blueprints/<modulo>/routes.py`: `# ______________________________ Nome_Da_Acao ______________________________`
- `src/services/api_<modulo>_service.py`: `# ______________________________ Nome_Do_Endpoint ______________________________`

---

## 4. Convenção de Nomenclatura do Domínio CRS

Os campos enviados e recebidos dos formulários e APIs respeitam a padronização do CRS:
- `cd...` (Código/Identificador textual ou chave alfanumérica): `cdUser`, `cdCnpj`, `cdRating`, `cdTicker`, `cdPassword`, `cdEmissoresOC3`, `cdEmissoresCRIMS`
- `ds...` (Descrição/Texto/Nome/Status): `dsNome`, `dsProfile`, `dsGrupo`, `dsEmissor`, `dsSetor`, `dsAlcadaAprovador`
- `id...` (Identificador numérico/ID): `idGrupo`, `idEmissor`, `idSolicitacao`, `idStatus`, `idEmissorHoldingConsumo`
- `vl...` (Valor numérico/Monetário/Peso/Percentual/Prazo): `vlPrazo`, `vlTerceiros`, `vlReservaTecnica`, `vlPesoAprovacao`, `vlPcConsumo`
- `dt...` (Data/DataHora): `dtSolicitacao`, `dtResposta`, `dtAprovacao`, `dtVencimento`, `dtDatabase`
- `ic...` (Indicador/Flag booleana 0 ou 1): `icHolding`, `icConsomeHolding`, `icLimiteMeta`, `icRunOff`

---

## 5. Estrutura do Workspace de Agentes

Consulte as regras e skills especializadas sempre que for atuar no frontend:
- **Regras de Arquitetura Frontend**: [architecture-standards.md](file:///c:/Users/henri/Documents/Projetos/credit_system/app-credit-risk-system-frontend/.agents/rules/architecture-standards.md)
- **Padrão Ouro de Blueprints (`grupos_economicos`)**: [blueprint-standards.md](file:///c:/Users/henri/Documents/Projetos/credit_system/app-credit-risk-system-frontend/.agents/rules/blueprint-standards.md)
- **Qualidade de Código Frontend**: [code-quality.md](file:///c:/Users/henri/Documents/Projetos/credit_system/app-credit-risk-system-frontend/.agents/rules/code-quality.md)
- **Skill de Criação/Refatoração de Blueprints**: [crs-frontend-module-scaffolder](file:///c:/Users/henri/Documents/Projetos/credit_system/app-credit-risk-system-frontend/.agents/skills/crs-frontend-module-scaffolder/SKILL.md)
- **Skill de Arquitetura e Mapa do Frontend**: [crs-frontend-architecture](file:///c:/Users/henri/Documents/Projetos/credit_system/app-credit-risk-system-frontend/.agents/skills/crs-frontend-architecture/SKILL.md)
