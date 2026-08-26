# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
mapeamentos_blueprint = Blueprint('mapeamentos', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@mapeamentos_blueprint.route('/', methods=['GET'])
@login_required
def mapeamentos():
    return render_template(
        'mapeamentos.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
