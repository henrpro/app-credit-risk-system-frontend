# Importações do projeto
from blueprints.login.auth import User
from services.api_grupos_economicos_service import get_lista_grupos_economicos, get_grupo_economicos

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
    
    opcoes_grupos = get_lista_grupos_economicos()
    return render_template('grupos_economicos.html', opcoes_grupos=opcoes_grupos)


# Define uma rota para a página de login
@grupos_economicos_blueprint.route('/grupos_economicos_result', methods=['GET', 'POST'])
def grupos_economicos_result() -> Any:
    opcoes_grupos = get_lista_grupos_economicos()
    grupo_data = get_grupo_economicos()
    
    n_emissores = len(grupo_data['idEmissor'])
    emissores = []
    for i in range(n_emissores):
        emissores.append({
            'id': grupo_data['idEmissor'][i],
            'nome': grupo_data['dsEmissor'][i],
            'is_holding': bool(grupo_data['icHolding'][i]),
            'parent_id': grupo_data['idEmissorHoldingConsumo'][i],
            'setor': grupo_data['dsSetor'][i],
            'oc3': grupo_data['cdEmissorOC3'][i],
            'papeis': grupo_data['cdListaPapeis'][i]
        })
        
    holdings = [e for e in emissores if e['is_holding']]
    independentes = [e for e in emissores if not e['is_holding'] and e['parent_id'] is None]
    
    for h in holdings:
        h['children'] = [e for e in emissores if e['parent_id'] == h['id']]
        
    organograma = {
        'nome_grupo': grupo_data['dsNome'],
        'holdings': holdings,
        'independentes': independentes
    }

    return render_template('grupos_economicos_result.html', opcoes_grupos=opcoes_grupos, organograma=organograma)

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