# Importações do projeto
from blueprints.login.auth import User
from services.api_grupos_economicos_service import APIGruposEconomicosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required
from typing import Any

# Cria a blueprint
grupos_economicos_blueprint = Blueprint('grupos_economicos', __name__, template_folder='templates', static_folder='static')

# Define uma rota para a página de login
@grupos_economicos_blueprint.route('/grupos-economicos', methods=['GET', 'POST'])
@login_required
def grupos_economicos() -> Any:
    if request.method == 'POST':
        pass
    
    opcoes_grupos = APIGruposEconomicosService.get_grupos_economicos_cadastrados()
    return render_template('grupos_economicos.html', opcoes_grupos=opcoes_grupos)


# Define uma rota para a página de login
@grupos_economicos_blueprint.route('/grupos_economicos_result', methods=['GET', 'POST'])
@login_required
def grupos_economicos_result() -> Any:
    opcoes_grupos = APIGruposEconomicosService.get_grupos_economicos_cadastrados()
    
    ds_grupo = request.form.get('grupo') or request.args.get('grupo') or "GRUPO TESTE"
    
    grupo_data_list = []
    try:
        grupo_data_list = APIGruposEconomicosService.consultar_grupo_economico({'dsGrupo': ds_grupo})
    except Exception:
        pass
    
    emissores = []
    for item in grupo_data_list:
        emissores.append({
            'id': item.get('idEmissor'),
            'nome': item.get('dsEmissor'),
            'is_holding': bool(item.get('icHolding')),
            'parent_id': item.get('idEmissorHoldingConsumo'),
            'setor': item.get('dsSetor'),
            'oc3': item.get('cdEmissorOC3'),
            'papeis': item.get('cdListaPapeis')
        })
        
    holdings = [e for e in emissores if e['is_holding']]
    independentes = [e for e in emissores if not e['is_holding'] and e['parent_id'] is None]
    
    for h in holdings:
        h['children'] = [e for e in emissores if e['parent_id'] == h['id']]
        
    organograma = {
        'nome_grupo': ds_grupo,
        'holdings': holdings,
        'independentes': independentes
    }

    return render_template('grupos_economicos_result.html', opcoes_grupos=opcoes_grupos, organograma=organograma)

@grupos_economicos_blueprint.route('/api/buscar-emissores')
@login_required
def buscar_emissores() -> Any:
    query = request.args.get('q', '')
    
    try:
        dados = APIGruposEconomicosService.obtem_emissores_oc3({'dsEmissor': query})
        resultados = [
            {"codigo": item.get("cd_Emissor", ""), "nome": item.get("cd_Emissor", "")} 
            for item in dados
        ]
    except Exception:
        resultados = []
        
    return jsonify(resultados)