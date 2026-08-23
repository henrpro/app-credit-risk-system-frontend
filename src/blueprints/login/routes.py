# Importações do projeto
from blueprints.login.auth import User

# Importações de bibliotecas
from flask_login import LoginManager, login_user, login_required, logout_user
from flask import Blueprint, render_template, redirect, url_for, request, flash
from typing import Any

# Cria a blueprint
login_blueprint = Blueprint('login_blueprint', __name__, template_folder='templates', static_folder='static')

# Configura o LoginManager
login_manager = LoginManager()
login_manager.login_view = 'login_blueprint.login_user_route'
login_manager.login_message = None

# Função de carregamento de usuário
@login_manager.user_loader
def load_user(username: str) -> User:
    return User.get_login(username)

# Define uma rota para a página de login
@login_blueprint.route('/login', methods=['GET', 'POST'])
def login_user_route() -> Any:
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        success, grupo = User.authenticate_user(username, password)

        if success:
            user = User(username, password, grupo)
            login_user(user)
            return redirect(url_for('home_page'))
        else:
            flash('Usuário ou senha inválidos.', 'danger')
            return redirect(url_for('login_blueprint.login_user_route'))
    return render_template('login.html')

# Define uma rota para logout
@login_blueprint.route('/logout')
@login_required
def logout() -> Any:
    logout_user()
    return redirect(url_for('login_blueprint.login_user_route'))