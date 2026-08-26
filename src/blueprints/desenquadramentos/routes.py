# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
desenquadramentos_blueprint = Blueprint('desenquadramentos', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@desenquadramentos_blueprint.route('/', methods=['GET'])
@login_required
def desenquadramentos():
    return render_template(
        'desenquadramentos.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
