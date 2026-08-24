# Importações do projeto
from services.api_solicitar_alcada_service import APISolicitarAlcadaService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
solicitar_alcada_blueprint = Blueprint('solicitar_alcada', __name__, template_folder='templates', static_folder='static')

# ______________________________ Solicitar Alçada ______________________________

@solicitar_alcada_blueprint.route('/', methods=['GET', 'POST'])
@login_required
def solicitar_alcada():
    # Começamos pegando as variáveis gerais da página
    grupos_cadastrados = APISolicitarAlcadaService.get_grupos_economicos_cadastrados()
    eventos_cadastrados = APISolicitarAlcadaService.get_tipos_de_eventos_cadastrados()
    grupo_selecionado = None
    id_evento_selecionado = None

    if request.method == 'POST':
        try:
            grupo_selecionado = request.form.get('dsGrupo')
            id_tipo_evento_selecionado = request.form.get('idTipoEvento')

        except Exception as e:
            flash()
            redirect()

    return render_template(
        'solicitar_alcada.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        grupos_cadastrados=grupos_cadastrados,
        eventos_cadastrados=eventos_cadastrados,
        grupo_selecionado=grupo_selecionado,
        id_evento_selecionado=id_evento_selecionado
    )

