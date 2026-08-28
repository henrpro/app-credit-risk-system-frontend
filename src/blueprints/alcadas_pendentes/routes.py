# Importações do projeto
from services.api_alcadas_pendentes_service import APIAlcadasPendentesService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user
import pandas as pd

# Cria a blueprint
alcadas_pendentes_blueprint = Blueprint('alcadas_pendentes', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@alcadas_pendentes_blueprint.route('/', methods=['GET'])
@login_required
def alcadas_pendentes():
    try:
        alcadas = APIAlcadasPendentesService.consultar_alcadas_pendentes()
        if isinstance(alcadas, list):
            alcadas.sort(key=lambda x: str(x.get('dtSolicitacao') or ''), reverse=True)
            for a in alcadas:
                a['dtSolicitacaoFormatada'] = pd.to_datetime(a['dtSolicitacao']).strftime('%d/%m/%Y') if a.get('dtSolicitacao') else '-'
        else:
            alcadas = []
    except Exception as e:
        flash(f"Erro ao carregar alçadas pendentes: {str(e)}", "error")
        alcadas = []

    return render_template(
        'alcadas_pendentes.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        alcadas=alcadas
    )


@alcadas_pendentes_blueprint.route('/api/detalhes-solicitacao', methods=['GET'])
@login_required
def api_detalhes_solicitacao():
    try:
        id_solicitacao = request.args.get('idSolicitacao')
        dados = APIAlcadasPendentesService.obtem_dados_solicitacao({'idSolicitacao': id_solicitacao})
        return jsonify({'success': True, 'data': dados}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@alcadas_pendentes_blueprint.route('/responder-alcada', methods=['POST'])
@login_required
def responder_alcada():
    try:
        if request.is_json:
            data = request.get_json()
            id_solicitacao = data.get('idSolicitacao')
            ds_alcada = data.get('dsAlcada')
        else:
            id_solicitacao = request.form.get('idSolicitacao')
            ds_alcada = request.form.get('dsAlcada')

        payload = {
            'idSolicitacao': id_solicitacao,
            'dsAlcada': ds_alcada,
            'cdUserResposta': current_user.id,
            'idStatus': 2
        }

        APIAlcadasPendentesService.responder_alcada(payload)

        if request.is_json:
            return jsonify({'success': True, 'message': f"Alçada '{ds_alcada}' definida com sucesso!"}), 200

        flash(f"Alçada '{ds_alcada}' definida com sucesso para a solicitação!", "success")
    except Exception as e:
        if request.is_json:
            return jsonify({'success': False, 'message': str(e)}), 500
        flash(f"Erro ao responder alçada: {str(e)}", "error")

    return redirect(url_for('alcadas_pendentes.alcadas_pendentes'))

