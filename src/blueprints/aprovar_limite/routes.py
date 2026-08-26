# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
aprovar_limite_blueprint = Blueprint('aprovar_limite', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@aprovar_limite_blueprint.route('/', methods=['GET'])
@login_required
def aprovar_limite():
    return render_template(
        'aprovar_limite.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
