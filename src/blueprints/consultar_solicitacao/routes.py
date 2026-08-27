# Importações do projeto
from services.api_consultar_solicitacao_service import APIConsultarSolicitacaoService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
import pandas as pd

# Cria a blueprint
consulta_solicitacoes_blueprint = Blueprint('consulta_solicitacoes', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@consulta_solicitacoes_blueprint.route('/', methods=['GET'])
@login_required
def consulta_solicitacoes():
    # Obtemos as solicitações pendentes para a mesa do usuário logado
    solicitacoes = APIConsultarSolicitacaoService.obtem_solicitacoes_pendentes({'dsProfile': current_user.grupo})

    # Ordenamos de forma decrescente pela data da solicitação
    solicitacoes.sort(key=lambda x: str(x.get('dtSolicitacao') or ''), reverse=True)
    for s in solicitacoes: 
        s['dtSolicitacao'] = pd.to_datetime(s['dtSolicitacao']).strftime('%d/%m/%Y') if s.get('dtSolicitacao') else ''

    return render_template(
        'consulta_solicitacoes.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        solicitacoes=solicitacoes
    )

# ______________________________ Enviar Para Aprovação ______________________________

@consulta_solicitacoes_blueprint.route('/enviar-aprovacao', methods=['POST'])
@login_required
def enviar_para_aprovacao():
    try:
        id_solicitacao = request.form.get('idSolicitacao')
        payload = {'idSolicitacao': int(id_solicitacao)}
        APIConsultarSolicitacaoService.atualizar_status_aprovacao_pendente(payload)
        flash(f"Solicitação #{id_solicitacao} enviada para aprovação com sucesso!", "success")
    except Exception as e:
        flash(f"Erro ao enviar solicitação para aprovação: {str(e)}", "error")
    return redirect(url_for('consulta_solicitacoes.consulta_solicitacoes'))

# ______________________________ Cancelar Solicitação ______________________________

@consulta_solicitacoes_blueprint.route('/cancelar-solicitacao', methods=['POST'])
@login_required
def cancelar_solicitacao():
    try:
        id_solicitacao = request.form.get('idSolicitacao')
        payload = {'idSolicitacao': int(id_solicitacao)}
        APIConsultarSolicitacaoService.atualizar_status_cancelar_solicitacao(payload)
        flash(f"Solicitação #{id_solicitacao} cancelada com sucesso!", "info")
    except Exception as e:
        flash(f"Erro ao cancelar solicitação: {str(e)}", "error")
    return redirect(url_for('consulta_solicitacoes.consulta_solicitacoes'))
