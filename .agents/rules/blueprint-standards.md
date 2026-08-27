# Padrão de Desenvolvimento de Blueprints — Baseado em `grupos_economicos`

A blueprint `grupos_economicos` é o **padrão ouro** oficial de desenvolvimento do frontend do CRS. Qualquer nova funcionalidade ou refatoração de blueprint existente deve espelhar rigorosamente as convenções de estrutura, rotas, templates e scripts demonstradas nela.

---

## 1. Estrutura Canônica de Diretórios da Blueprint

Cada blueprint deve conter sua própria árvore autossuficiente de rotas, templates e arquivos estáticos:

```
src/blueprints/<nome_modulo>/
├── __init__.py (opcional)
├── routes.py
├── static/
│   ├── css/
│   │   └── <nome_modulo>.css
│   └── js/
│       └── <nome_modulo>.js
└── templates/
    ├── <nome_modulo>.html             # Página principal / Hub de Ações
    ├── <nome_modulo>_criar.html       # Formulário de Cadastro
    ├── <nome_modulo>_consultar.html   # Visualização / Organograma / Relatório
    └── <nome_modulo>_alterar.html     # Edição / Exclusão
```

---

## 2. Padrão da Rota Principal (Hub de Ações)

A rota raiz da blueprint (`/`) serve como portal central da funcionalidade, apresentando os cards de ação para navegação:

```python
# ______________________________ Geral _______________________________________

@grupos_economicos_blueprint.route('/', methods=['GET'])
@login_required
def grupos_economicos():
    return render_template(
        'grupos_economicos.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
```

### Visual do Hub (`<modulo>.html`):
Utiliza o padrão visual de `.action-card` e `.btn-action-card`:
```html
<div class="action-card">
  <div class="action-card-title">Selecione uma das opções abaixo:</div>
  <div class="action-buttons-group">
    <a href="{{ url_for('<blueprint>.criar_<modulo>') }}" class="btn-action-card">
      <i class="bi bi-plus-circle"></i>
      <span>Cadastrar</span>
    </a>
    <a href="{{ url_for('<blueprint>.consultar_<modulo>') }}" class="btn-action-card">
      <i class="bi bi-search"></i>
      <span>Consultar</span>
    </a>
    <a href="{{ url_for('<blueprint>.alterar_<modulo>') }}" class="btn-action-card">
      <i class="bi bi-pencil-square"></i>
      <span>Alterar / Excluir</span>
    </a>
  </div>
</div>
```

---

## 3. Padrão de Rota com Despacho por `action` (Formulários Complexos)

Em páginas que realizam pesquisa e salvamento no mesmo fluxo (como `alterar`), utiliza-se o parâmetro `action`:

```python
# ______________________________ Alterar Grupo ______________________________

@grupos_economicos_blueprint.route('/alterar', methods=['GET', 'POST'])
@login_required
def alterar_grupo_economico():
    # Variáveis importantes para a rota
    grupos_cadastrados = APIGruposEconomicosService.get_grupos_economicos_cadastrados()
    setores = APIGruposEconomicosService.obtem_setores_cadastrados()

    grupo_selecionado = None
    dados_grupo = None

    if request.method == 'POST':
        action = request.form.get('action')

        # Fluxo de Pesquisar para Edição
        if action == 'pesquisar':
            try:
                grupo_selecionado = request.form.get('dsGrupo', '').strip()
                dados_raw = APIGruposEconomicosService.consultar_grupo_economico({'dsGrupo': grupo_selecionado})
                # Trata e estrutura dados para exibição...
            except Exception as e:
                flash(f"Erro ao buscar: {str(e)}", "error")

        # Fluxo de Salvar Alterações
        elif action == 'atualizar':
            try:
                # Extrai dados, monta payload e chama API
                payload = { ... }
                APIGruposEconomicosService.atualizar_grupo_economico(payload)
                flash("Atualizado com sucesso!", "success")
                return redirect(url_for('grupos_economicos.grupos_economicos'))
            except Exception as e:
                flash(f"{str(e)}", "error")

    return render_template(
        'grupos_economicos_alterar.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        grupos_cadastrados=grupos_cadastrados,
        grupo_selecionado=grupo_selecionado,
        dados_grupo=dados_grupo
    )
```

---

## 4. Padrão de Endpoints Assíncronos (`/api/...`)

Para modais de busca, autocompletes ou combos em cascata:

```python
@grupos_economicos_blueprint.route('/api/emissores-oc3', methods=['GET'])
@login_required
def api_obtem_emissores_oc3():
    try:
        filtros = request.args.to_dict()
        dados = APIGruposEconomicosService.obtem_emissores_oc3(filtros=filtros)
        return jsonify({"success": True, "data": dados}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "data": []}), 500
```

---

## 5. Padrão de Modais com 5 Estados de Interface

Os modais de consulta e associação assíncrona seguem o padrão de 5 estados no HTML:
1. `initial-state`: Mensagem instruindo a digitação e busca.
2. `loading-state`: Spinner de carregamento durante a requisição `fetch`.
3. `content-state`: Tabela de resultados com cabeçalho de contagem e checkbox "Selecionar Todos".
4. `empty-state`: Mensagem amigável de nenhum resultado encontrado.
5. `error-state`: Banner de erro com mensagem retornada da API.

---

## 6. Padrão de Template Jinja2

Todo template de blueprint deve terminar com os blocos `extra_css` e `extra_js`:

```jinja2
{% extends 'base.html' %}

{% block title %}CRS - Nome do Módulo{% endblock %}

{% block content %}
<div class="pagetitle mb-4">
  <h1 class="pagetitle-main">Título da Página</h1>
</div>

<div class="card p-4">
  <!-- Conteúdo da tela -->
</div>
{% endblock %}

{% block extra_css %}
<link rel="stylesheet" href="{{ url_for('<blueprint>.static', filename='css/<modulo>.css') }}">
{% endblock %}

{% block extra_js %}
<script src="{{ url_for('<blueprint>.static', filename='js/<modulo>.js') }}"></script>
{% endblock %}
```
