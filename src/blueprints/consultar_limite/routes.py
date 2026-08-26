# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
consultar_limite_blueprint = Blueprint('consultar_limite', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@consultar_limite_blueprint.route('/', methods=['GET'])
@login_required
def consultar_limite():
    return render_template(
        'consultar_limite.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
