# Template Padrão de Módulo / Blueprint — CRS Frontend

Utilize estes modelos estruturais ao criar um novo módulo no front-end do CRS.

---

## 1. Template: `src/services/api_<modulo>_service.py`

```python
# Importações de bibliotecas
from flask import current_app
import requests


class APINomeModuloService:

    # ______________________________ Consultas ___________________________________

    @classmethod
    def get_itens_cadastrados(cls, filtros: dict = None):
        try:
            response = requests.get(
                f"{current_app.config['BACKEND_URL']}/v1/nome-modulo/obtem-itens-cadastrados",
                params=filtros
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    # ______________________________ Mutações ____________________________________

    @classmethod
    def registrar_item(cls, payload: dict):
        try:
            response = requests.post(
                f"{current_app.config['BACKEND_URL']}/v1/nome-modulo/registrar-item",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e

    @classmethod
    def deletar_item(cls, payload: dict):
        try:
            response = requests.post(
                f"{current_app.config['BACKEND_URL']}/v1/nome-modulo/deletar-item",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e
```

---

## 2. Template: `src/blueprints/<modulo>/routes.py`

```python
# Importações do projeto
from services.api_nome_modulo_service import APINomeModuloService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
nome_modulo_blueprint = Blueprint('nome_modulo', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@nome_modulo_blueprint.route('/', methods=['GET'])
@login_required
def nome_modulo():
    return render_template(
        'nome_modulo.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )

# ______________________________ Cadastrar ___________________________________

@nome_modulo_blueprint.route('/criar', methods=['GET', 'POST'])
@login_required
def criar_item():
    if request.method == 'POST':
        try:
            # Extrai e sanitiza os dados do formulário
            ds_nome = request.form.get('dsNome', '').strip()
            
            payload = {
                'dsNome': ds_nome
            }
            
            APINomeModuloService.registrar_item(payload)
            flash("Item cadastrado com sucesso!", "success")
            return redirect(url_for('nome_modulo.nome_modulo'))
        except Exception as e:
            flash(f"Erro ao cadastrar item: {str(e)}", "error")
            return redirect(url_for('nome_modulo.nome_modulo'))

    return render_template(
        'nome_modulo_criar.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )

# ______________________________ Endpoints API _______________________________

@nome_modulo_blueprint.route('/api/itens', methods=['GET'])
@login_required
def api_obtem_itens():
    try:
        filtros = request.args.to_dict()
        dados = APINomeModuloService.get_itens_cadastrados(filtros=filtros)
        return jsonify({"success": True, "data": dados}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "data": []}), 500
```

---

## 3. Template: `src/blueprints/<modulo>/templates/<modulo>.html`

```jinja2
{% extends 'base.html' %}

{% block title %}CRS - Nome do Módulo{% endblock %}

{% block content %}
<div class="pagetitle mb-4">
  <h1 class="pagetitle-main">Nome do Módulo</h1>
</div>

<div class="card p-4">
  <div class="action-card">
    <div class="action-card-title">Selecione uma das opções abaixo:</div>
    <div class="action-buttons-group">
      <a href="{{ url_for('nome_modulo.criar_item') }}" class="btn-action-card">
        <i class="bi bi-plus-circle"></i>
        <span>Cadastrar</span>
      </a>
    </div>
  </div>
</div>
{% endblock %}

{% block extra_css %}
<link rel="stylesheet" href="{{ url_for('nome_modulo.static', filename='css/nome_modulo.css') }}">
{% endblock %}

{% block extra_js %}
<script src="{{ url_for('nome_modulo.static', filename='js/nome_modulo.js') }}"></script>
{% endblock %}
```
