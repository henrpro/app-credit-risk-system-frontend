# Padrões de Arquitetura — CRS Frontend

O frontend do Credit Risk System (CRS) é estruturado de forma modular utilizando o Flask, desacoplando a interface de usuário (Jinja2 / HTML / CSS / JS), as regras de apresentação/roteamento (Blueprints) e a comunicação com a API de backend (Services).

---

## Fluxo de Execução no Frontend

```
[ Usuário / Navegador ]
        │
        ▼ (HTTP Request - GET / POST)
1. Blueprints (`src/blueprints/<modulo>/routes.py`)
        │
        ▼ (Chamada de método de classe)
2. API Services (`src/services/api_<modulo>_service.py`)
        │
        ▼ (HTTP Request REST /v1/...)
[ Backend CRS REST API ] (Flask Backend)
        │
        ▼ (JSON Response)
3. API Services (Processa JSON / raise_for_status)
        │
        ▼ (Dados estruturados / Listas de Dicts)
4. Blueprints (Trata dados, organiza organogramas/filtros, define flash messages)
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
5a. Templates Jinja2            5b. JSON API Endpoint
   (`templates/<modulo>.html`)     (para AJAX do frontend)
   + Static CSS/JS
        │                               │
        ▼                               ▼
[ Renderização HTML / Resposta JSON ao Navegador ]
```

---

## Responsabilidade de Cada Camada

### 1. `src/blueprints/<modulo>/routes.py`
- Instancia a `Blueprint` com suas próprias pastas de `template_folder='templates'` e `static_folder='static'`.
- Protege as rotas com decorators `@login_required` e valida permissões de perfil quando aplicável (`current_user.grupo`).
- Recebe requisições HTTP (GET para exibição/pesquisa, POST para mutações e submissão de formulários).
- Extrai e sanitiza os dados do formulário (`request.form.get()`, `request.form.getlist()`, `.strip()`, conversões explícitas).
- Invoca a camada de serviços `APINomeModuloService`.
- Trata fluxos complexos em uma única rota POST utilizando despacho de ações (`action = request.form.get('action')`).
- Envia notificações ao usuário através do mecanismo de flash do Flask (`flash(mensagem, categoria)`).
- Redireciona para rotas nomeadas com `redirect(url_for('<blueprint>.<funcao>'))` ou renderiza templates com `render_template()`.
- Expõe endpoints auxiliares `/api/...` para consultas dinâmicas de modais e componentes interativos, retornando `jsonify({"success": True, "data": ...})`.

```python
# Importações do projeto
from services.api_grupos_economicos_service import APIGruposEconomicosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
grupos_economicos_blueprint = Blueprint('grupos_economicos', __name__, template_folder='templates', static_folder='static')
```

---

### 2. `src/services/api_<modulo>_service.py`
- Centraliza toda a comunicação HTTP entre o frontend e a API REST do backend.
- Define a classe `API<PascalCaseModulo>Service` contendo exclusivamente métodos de classe (`@classmethod`).
- Utiliza `current_app.config['BACKEND_URL']` para montar a URL base dos endpoints: `f"{current_app.config['BACKEND_URL']}/v1/<kebab-case-modulo>/<acao>"`.
- Executa chamadas HTTP com a biblioteca `requests`:
  - Consultas (`GET`): `requests.get(url, params=filtros)`
  - Mutações (`POST`): `requests.post(url, json=payload)`
- Verifica status da resposta com `response.raise_for_status()`.
- Em caso de `requests.exceptions.HTTPError`, propaga a mensagem de erro detalhada retornada pelo backend (`raise Exception(response.text) from e`).

```python
# Importações de bibliotecas
from flask import current_app
import requests


class APIGruposEconomicosService:

    @classmethod
    def get_grupos_economicos_cadastrados(cls):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/obtem-grupos-economicos-cadastrados")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e
```

---

### 3. `src/blueprints/<modulo>/templates/`
- Arquivos `.html` Jinja2 específicos da funcionalidade.
- Todos os templates de página estendem o layout base global:
  ```jinja2
  {% extends 'base.html' %}
  {% block title %}CRS - Nome da Funcionalidade{% endblock %}
  {% block content %}
    ...
  {% endblock %}
  {% block extra_css %}
    <link rel="stylesheet" href="{{ url_for('<blueprint>.static', filename='css/<modulo>.css') }}">
  {% endblock %}
  {% block extra_js %}
    <script src="{{ url_for('<blueprint>.static', filename='js/<modulo>.js') }}"></script>
  {% endblock %}
  ```
- Modularização em telas independentes para ações específicas (ex: `<modulo>.html` para visão inicial, `<modulo>_criar.html`, `<modulo>_consultar.html`, `<modulo>_alterar.html`).

---

### 4. `src/blueprints/<modulo>/static/`
- Diretórios dedicados `css/` e `js/` contendo os estilos e comportamentos específicos da blueprint.
- CSS estruturado com tokens de cores do CRS (`var(--color-accent)`, `var(--color-bg-card)`, `var(--color-text-main)`).
- JavaScript modular e linear, sem dependências externas desnecessárias, lidando com manipulação de DOM, modais Bootstrap, chamadas assíncronas (`fetch`) aos endpoints `/api/...` da blueprint e renderização dinâmica.

---

### 5. `src/app.py`
- Instancia a aplicação Flask global com `template_folder='templates'` e `static_folder='static'`.
- Registra cada blueprint com o seu prefixo padronizado (`url_prefix='/<kebab-case-modulo>'`).
- Configura o gerenciador de sessão `LoginManager`.
- Registra o context processor global `inject_user` para disponibilizar `username` e `grupo` em todos os templates.
