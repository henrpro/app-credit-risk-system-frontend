# Importações do projeto
from blueprints.grupos_economicos.routes import grupos_economicos_blueprint
from blueprints.solicitar_alcada.routes import solicitar_alcada_blueprint
from blueprints.login.routes import login_blueprint, login_manager
from config.config import init_config

# Importações de bibliotecas
from flask_login import login_required, current_user
from flask import Flask, render_template

# Instancia a aplicação
app = Flask(__name__, template_folder='templates', static_folder='static')

# Registra as blueprints
app.register_blueprint(grupos_economicos_blueprint, url_prefix='/grupos-economicos')
app.register_blueprint(solicitar_alcada_blueprint, url_prefix='/solicitar-alcada')
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