# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
monitor_tarefas_blueprint = Blueprint('monitor_tarefas', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@monitor_tarefas_blueprint.route('/', methods=['GET'])
@login_required
def monitor_tarefas():
    return render_template(
        'monitor_tarefas.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )
