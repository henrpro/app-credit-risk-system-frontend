# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
consulta_solicitacoes_blueprint = Blueprint('consulta_solicitacoes', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@consulta_solicitacoes_blueprint.route('/', methods=['GET'])
@login_required
def consulta_solicitacoes():
    return render_template(
        'consulta_solicitacoes.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
