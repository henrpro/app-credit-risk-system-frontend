# Importações do projeto
from blueprints.login.auth import User

# Importações de bibliotecas
from flask_login import LoginManager, login_user, login_required, logout_user
from flask import Blueprint, render_template, redirect, url_for, request
from typing import Any

# Cria a blueprint
grupos_economicos_blueprint = Blueprint('grupos_economicos', __name__, template_folder='templates', static_folder='static')


# Define uma rota para a página de login
@grupos_economicos_blueprint.route('/grupos_economicos', methods=['GET', 'POST'])
def grupos_economicos() -> Any:
    if request.method == 'POST':
        pass

    return render_template('grupos_economicos.html')


# Define uma rota para a página de login
@grupos_economicos_blueprint.route('/grupos_economicos_result', methods=['GET', 'POST'])
def grupos_economicos_result() -> Any:
    if request.method == 'POST':
        pass