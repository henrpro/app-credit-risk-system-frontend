# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
historico_casos_blueprint = Blueprint('historico_casos', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@historico_casos_blueprint.route('/', methods=['GET'])
@login_required
def historico_casos():
    return render_template(
        'historico_casos.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
