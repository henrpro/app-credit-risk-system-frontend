# Importações do projeto
from services.api_historico_casos_service import APIHistoricoCasosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, flash
from flask_login import login_required, current_user
import pandas as pd

# Cria a blueprint
historico_casos_blueprint = Blueprint('historico_casos', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@historico_casos_blueprint.route('/', methods=['GET'])
@login_required
def historico_casos():
    try:
        # Obtemos as solicitações finalizadas para a mesa do usuário logado
        solicitacoes = APIHistoricoCasosService.obtem_solicitacoes_finalizadas({'dsProfile': current_user.grupo})
        solicitacoes.sort(key=lambda x: str(x.get('dtSolicitacao') or ''), reverse=True)
        for s in solicitacoes:
            s['dtSolicitacao'] = pd.to_datetime(s['dtSolicitacao']).strftime('%d/%m/%Y') if s.get('dtSolicitacao') else ''
    except Exception as e:
        flash(f"Erro ao carregar histórico de casos: {str(e)}", "error")
        solicitacoes = []

    return render_template(
        'historico_casos.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        solicitacoes=solicitacoes
    )


@historico_casos_blueprint.route('/api/detalhes-solicitacao/<int:id_solicitacao>', methods=['GET'])
@login_required
def api_detalhes_solicitacao(id_solicitacao: int):
    try:
        dados = APIHistoricoCasosService.obtem_dados_solicitacao({'idSolicitacao': id_solicitacao})
        return jsonify({'success': True, 'data': dados}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

