# Importações do projeto
from services.api_gestao_de_usuarios_service import APIGestaoDeUsuariosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
gestao_de_usuarios_blueprint = Blueprint('gestao_de_usuarios', __name__, template_folder='templates', static_folder='static')

@gestao_de_usuarios_blueprint.route('/', methods=['GET'])
@login_required
def gestao_de_usuarios():
    usuarios_cadastrados = APIGestaoDeUsuariosService.get_usuarios_cadastrados()
    return render_template(
        'gestao_de_usuarios.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        usuarios_cadastrados=usuarios_cadastrados
    )


@gestao_de_usuarios_blueprint.route('/api/consultar-usuario/<cd_user>', methods=['GET'])
@login_required
def api_obtem_dados_usuario(cd_user):
    try:
        dados = APIGestaoDeUsuariosService.get_dados_usuario(cd_user)
        return jsonify({'success': True, 'data': dados[0]}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@gestao_de_usuarios_blueprint.route('/salvar-usuario', methods=['POST'])
@login_required
def salvar_usuario():
    try:
        # Começamos extraindo os dados do formulário
        cd_user = request.form.get('cdUser', '').strip()
        ds_nome = request.form.get('dsNome', '').strip()
        cd_password = request.form.get('cdPassword', '').strip()
        ds_profile = request.form.get('dsProfile', '').strip()
        ds_alcada_aprovador = request.form.get('dsAlcadaAprovador')
        vl_peso_aprovacao = request.form.get('vlPesoAprovacao')

        # Tratamento dos campos opcionais
        ds_alcada_aprovador = None if ds_alcada_aprovador in ('Nenhuma', None, '') else ds_alcada_aprovador.strip()
        vl_peso_aprovacao = float(vl_peso_aprovacao.replace(',', '.')) if vl_peso_aprovacao and ds_alcada_aprovador else None

        # Montamos o payload
        payload = {
            'cdUser': cd_user,
            'dsNome': ds_nome,
            'cdPassword': cd_password,
            'dsProfile': ds_profile,
            'dsAlcadaAprovador': ds_alcada_aprovador,
            'vlPesoAprovacao': vl_peso_aprovacao
        }

        # Chamamos a API para cadastrar o usuário
        APIGestaoDeUsuariosService.registrar_usuario(payload)
        flash(f"Usuário '{cd_user}' cadastrado/atualizado com sucesso!", "success")

    except Exception as e:
        flash(f"Erro ao salvar usuário: {str(e)}", "error")

    return redirect(url_for('gestao_de_usuarios.gestao_de_usuarios'))


@gestao_de_usuarios_blueprint.route('/deletar-usuario', methods=['POST'])
@login_required
def deletar_usuario():
    try:
        # Capturamos o user e montamos o payload
        cd_user = request.form.get('cdUser', '').strip()
        payload = {'cdUser': cd_user}

        # Chamamos a api de delete
        APIGestaoDeUsuariosService.deletar_usuario(payload)
        flash(f"Usuário '{cd_user}' excluído com sucesso!", "success")

    except Exception as e:
        flash(f"Erro ao excluir usuário: {str(e)}", "error")

    return redirect(url_for('gestao_de_usuarios.gestao_de_usuarios'))
