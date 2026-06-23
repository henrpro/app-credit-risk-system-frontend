# Importações do projeto
from services.api_grupo_economico_service import get_setores_atuacao

# Importações de bibliotecas
from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_login import login_required


grupo_economico_bp = Blueprint(
    'grupo_economico', 
    __name__, 
    template_folder='templates',
    static_folder='static'
)

@grupo_economico_bp.route('/cadastro', methods=['GET', 'POST'])
@login_required
def cadastro():
    if request.method == 'POST':
        
        flash('Cadastro realizado com sucesso!', 'success')
        return redirect(url_for('grupo_economico.cadastro'))
        
    setores = get_setores_atuacao()
    return render_template('cadastro_grupo.html', setores=setores)
