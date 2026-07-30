# Importações do projeto
from blueprints.login.auth import User

# Importações de bibliotecas
from flask import Blueprint, render_template, redirect, url_for, request, jsonify
from flask_login import LoginManager, login_user, login_required, logout_user
from typing import Any

# Cria a blueprint
grupos_economicos_blueprint = Blueprint('grupos_economicos', __name__, template_folder='templates', static_folder='static')

# Define uma rota para a página de login
@grupos_economicos_blueprint.route('/grupos_economicos', methods=['GET', 'POST'])
def grupos_economicos() -> Any:
    if request.method == 'POST':
        pass
    return render_template('grupos_economicos.html')


# Define uma rota para a página de login
@grupos_economicos_blueprint.route('/grupos_economicos_result', methods=['GET', 'POST'])
def grupos_economicos_result() -> Any:
    if request.method == 'POST':
        pass
    return render_template('grupos_economicos.html')

@grupos_economicos_blueprint.route('/api/buscar-emissores')
def buscar_emissores() -> Any:
    query = request.args.get('q', '').lower()
    
    # Base de dados simulada para busca
    mock_db = [
        {"codigo": "12345", "nome": "ITAU UNIBANCO HOLDING S.A."},
        {"codigo": "67890", "nome": "BANCO ITAU BBA S.A."},
        {"codigo": "54321", "nome": "ITAUSA S.A."},
        {"codigo": "11111", "nome": "REDE S.A."},
        {"codigo": "22222", "nome": "ITAU CORRETORA DE VALORES"}
    ]
    
    # Filtra os resultados pelo nome ou código
    resultados = [
        item for item in mock_db 
        if query in item['codigo'].lower() or query in item['nome'].lower()
    ]
    
    return jsonify(resultados)