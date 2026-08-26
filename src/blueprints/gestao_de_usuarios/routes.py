# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
gestao_de_usuarios_blueprint = Blueprint('gestao_de_usuarios', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@gestao_de_usuarios_blueprint.route('/', methods=['GET'])
@login_required
def gestao_de_usuarios():
    return render_template(
        'gestao_de_usuarios.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
