# Importações do projeto
from blueprints.consultar_solicitacao.routes import consulta_solicitacoes_blueprint
from blueprints.gestao_de_usuarios.routes import gestao_de_usuarios_blueprint
from blueprints.alcadas_pendentes.routes import alcadas_pendentes_blueprint
from blueprints.grupos_economicos.routes import grupos_economicos_blueprint
from blueprints.desenquadramentos.routes import desenquadramentos_blueprint
from blueprints.consultar_limite.routes import consultar_limite_blueprint
from blueprints.solicitar_alcada.routes import solicitar_alcada_blueprint
from blueprints.historico_casos.routes import historico_casos_blueprint
from blueprints.monitor_tarefas.routes import monitor_tarefas_blueprint
from blueprints.aprovar_limite.routes import aprovar_limite_blueprint
from blueprints.login.routes import login_blueprint, login_manager
from blueprints.mapeamentos.routes import mapeamentos_blueprint
from config.config import init_config

# Importações de bibliotecas
from flask_login import login_required, current_user
from flask import Flask, render_template

# Instancia a aplicação
app = Flask(__name__, template_folder='templates', static_folder='static')

# Registra as blueprints
app.register_blueprint(consulta_solicitacoes_blueprint, url_prefix='/consulta-solicitacoes')
app.register_blueprint(gestao_de_usuarios_blueprint, url_prefix='/gestao-de-usuarios')
app.register_blueprint(alcadas_pendentes_blueprint, url_prefix='/alcadas-pendentes')
app.register_blueprint(grupos_economicos_blueprint, url_prefix='/grupos-economicos')
app.register_blueprint(desenquadramentos_blueprint, url_prefix='/desenquadramentos')
app.register_blueprint(consultar_limite_blueprint, url_prefix='/consultar-limite')
app.register_blueprint(solicitar_alcada_blueprint, url_prefix='/solicitar-alcada')
app.register_blueprint(historico_casos_blueprint, url_prefix='/historico-casos')
app.register_blueprint(monitor_tarefas_blueprint, url_prefix='/monitor-tarefas')
app.register_blueprint(aprovar_limite_blueprint, url_prefix='/aprovar-limite')
app.register_blueprint(mapeamentos_blueprint, url_prefix='/mapeamentos')
app.register_blueprint(login_blueprint, url_prefix='/login')

# Rota inicial da aplicação
@app.route('/')
@login_required
def home_page():
    return render_template('home.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# Context processor para adicionar variáveis globais
@app.context_processor
def inject_user():
    if current_user.is_authenticated:
        return {'username': current_user.id, 'grupo': current_user.grupo}
    return {}

# Inicia a aplicação
if __name__ == '__main__':
    config = init_config()
    app.secret_key = config['secret_key']
    app.config['BACKEND_URL'] = config['backend_url']
    login_manager.init_app(app)
    app.run(debug=True, host='0.0.0.0', port=config['porta'])