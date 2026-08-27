---
name: crs-frontend-module-scaffolder
description: >-
  Utilize esta skill sempre que for criar uma nova blueprint, tela ou serviço de API
  no front-end do CRS, ou refatorar blueprints existentes seguindo o padrão ouro
  estabelecido em grupos_economicos.
---

# Guia de Construção e Refatoração de Blueprints — CRS Frontend

Esta skill fornece o guia passo a passo, convenções e checklists para criar ou refatorar qualquer módulo no frontend do CRS, mantendo alinhamento estrito com o padrão de `grupos_economicos`.

---

## 1. Ciclo de Criação de uma Nova Blueprint

Ao implementar uma nova tela/funcionalidade no frontend:

1. **Service de API (`src/services/api_<modulo>_service.py`)**:
   - Crie a classe `API<PascalCaseModulo>Service` com `@classmethod`.
   - Implemente chamadas HTTP para o backend utilizando `requests.get` e `requests.post`.
   - Utilize `f"{current_app.config['BACKEND_URL']}/v1/<kebab-case-modulo>/<endpoint>"`.
2. **Estrutura de Pastas da Blueprint**:
   - Crie a pasta `src/blueprints/<modulo>/`.
   - Crie as subpastas `templates/` e `static/` (com `css/` e `js/`).
3. **Rotas da Blueprint (`src/blueprints/<modulo>/routes.py`)**:
   - Instancie a `Blueprint('<modulo>', __name__, template_folder='templates', static_folder='static')`.
   - Organize as rotas com separadores `# ______________________________ Nome ______________________________`.
   - Aplique pirâmide invertida de imports e `@login_required` em todas as rotas.
   - Aplique lógica linear, sanitização de form data e flash messages.
4. **Templates Jinja2 (`src/blueprints/<modulo>/templates/`)**:
   - Crie `<modulo>.html` (página principal com cards de navegação).
   - Crie templates específicos para ações (`<modulo>_criar.html`, `<modulo>_consultar.html`, `<modulo>_alterar.html`).
   - Garanta que estendam `base.html` e incluam `extra_css` e `extra_js`.
5. **Estilos e Scripts (`src/blueprints/<modulo>/static/`)**:
   - Crie `css/<modulo>.css` utilizando as variáveis CSS do CRS.
   - Crie `js/<modulo>.js` com lógica modular e tratamento de eventos.
6. **Registro em `src/app.py`**:
   - Importe e registre a blueprint com `app.register_blueprint(<modulo>_blueprint, url_prefix='/<kebab-case-modulo>')`.
7. **Adição ao Menu Lateral (`src/templates/base.html`)**:
   - Adicione o item correspondente no `sidebar` com o respectivo ícone do Bootstrap Icons e controle de acesso por perfil (`current_user.grupo`).

---

## 2. Checklist de Qualidade Frontend

Antes de concluir qualquer implementação no frontend, valide:

- [ ] **Imports em Pirâmide Invertida**: Divisão em `# Importações do projeto` e `# Importações de bibliotecas` em ordem decrescente de tamanho de linha.
- [ ] **Lógica Linear Sem Nested Functions**: Nenhum `def` declarado dentro de outro `def`.
- [ ] **Despacho por `action`**: Formulários complexos que combinam busca e envio utilizam `request.form.get('action')`.
- [ ] **Sanitização de Dados**: Inputs tratados com `.strip()`, booleanos convertidos para `1`/`0`, campos opcionais sanitizados.
- [ ] **Flash Messages e Redirecionamento**: Sucessos e erros notificados via `flash(...)` seguidos de `redirect(url_for(...))`.
- [ ] **Isolamento de Services**: Nenhuma chamada `requests` direta na rota; tudo delegado para `APINomeModuloService`.
- [ ] **Estilos e Scripts Modularizados**: CSS e JS alocados dentro de `static/` da própria blueprint e injetados via `extra_css`/`extra_js`.

---

## 3. Template de Código

Consulte o arquivo [examples/blueprint-template.md](./examples/blueprint-template.md) para copiar o esqueleto inicial de cada arquivo.
