# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
alcadas_pendentes_blueprint = Blueprint('alcadas_pendentes', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@alcadas_pendentes_blueprint.route('/', methods=['GET'])
@login_required
def alcadas_pendentes():
    return render_template(
        'alcadas_pendentes.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
