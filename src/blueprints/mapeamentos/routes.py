# Importações do projeto
from services.api_mapeamentos_service import APIMapeamentosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
mapeamentos_blueprint = Blueprint('mapeamentos', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@mapeamentos_blueprint.route('/', methods=['GET'])
@login_required
def mapeamentos():
    return render_template(
        'mapeamentos.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )


# ______________________________ Emissor de Consumo __________________________

@mapeamentos_blueprint.route('/emissor-consumo', methods=['GET'])
@login_required
def emissor_consumo():
    # Começamos buscando os dados necessários para a página
    mapeamentos = APIMapeamentosService.consultar_mapeamentos_ativos()
    emissores_cadastrados = APIMapeamentosService.consultar_emissores_cadastrados()
    pendentes = APIMapeamentosService.consultar_ativos_sem_mapeamento()

    return render_template(
        'mapeamentos_emissor_consumo.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        mapeamentos=mapeamentos,
        emissores_cadastrados=emissores_cadastrados,
        pendentes=pendentes
    )


@mapeamentos_blueprint.route('/salvar-ativo', methods=['POST'])
@login_required
def salvar_ativo():
    try:
        cd_ticker = request.form.get('cdTicker', '').strip().upper()
        id_emissor = request.form.get('idEmissor')
        id_emissor_consumo = request.form.get('idEmissorConsumo')
        vl_pc_consumo = request.form.get('vlPcConsumo', '1.0').replace(',', '.')

        payload = {
            'cdTicker': cd_ticker,
            'idEmissor': int(id_emissor),
            'idEmissorConsumo': int(id_emissor_consumo),
            'vlPcConsumo': float(vl_pc_consumo)
        }

        APIMapeamentosService.salvar_mapeamento_ativo(payload)
        flash(f"Mapeamento do ativo '{cd_ticker}' salvo com sucesso!", "success")
    except Exception as e:
        flash(f"Erro ao salvar mapeamento do ativo: {str(e)}", "error")

    return redirect(url_for('mapeamentos.emissor_consumo'))


@mapeamentos_blueprint.route('/deletar-ativo', methods=['POST'])
@login_required
def deletar_ativo():
    try:
        cd_ticker = request.form.get('cdTicker', '').strip().upper()
        payload = {'cdTicker': cd_ticker}
        APIMapeamentosService.deletar_mapeamento_ativo(payload)
        flash(f"Mapeamento do ativo '{cd_ticker}' removido com sucesso!", "success")
    except Exception as e:
        flash(f"Erro ao excluir mapeamento do ativo: {str(e)}", "error")
    return redirect(url_for('mapeamentos.emissor_consumo'))


@mapeamentos_blueprint.route('/api/ativos-sem-mapeamento', methods=['GET'])
@login_required
def api_ativos_sem_mapeamento():
    try:
        dados = APIMapeamentosService.consultar_ativos_sem_mapeamento()
        return jsonify({'success': True, 'data': dados}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ______________________________ Produtos OC3 ________________________________

@mapeamentos_blueprint.route('/produtos-oc3', methods=['GET'])
@login_required
def produtos_oc3():
    mapeamentos = APIMapeamentosService.consultar_mapeamentos_produtos()
    pendentes = APIMapeamentosService.consultar_produtos_sem_mapeamento()

    return render_template(
        'mapeamentos_produtos_oc3.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        mapeamentos=mapeamentos,
        pendentes=pendentes
    )


@mapeamentos_blueprint.route('/salvar-produto', methods=['POST'])
@login_required
def salvar_produto():
    try:
        cd_produto_oc3 = request.form.get('cdProdutoOC3', '').strip()
        ic_captura = request.form.get('icCaptura', '1')

        if not cd_produto_oc3:
            flash("O código do produto OC3 é obrigatório.", "error")
            return redirect(url_for('mapeamentos.produtos_oc3'))

        payload = {
            'cdProdutoOC3': cd_produto_oc3,
            'icCaptura': int(ic_captura)
        }

        APIMapeamentosService.salvar_mapeamento_produto(payload)
        flash(f"Mapeamento do produto '{cd_produto_oc3}' salvo com sucesso!", "success")
    except Exception as e:
        flash(f"Erro ao salvar mapeamento do produto: {str(e)}", "error")

    return redirect(url_for('mapeamentos.produtos_oc3'))


@mapeamentos_blueprint.route('/deletar-produto', methods=['POST'])
@login_required
def deletar_produto():
    try:
        cd_produto_oc3 = request.form.get('cdProdutoOC3', '').strip()
        payload = {'cdProdutoOC3': cd_produto_oc3}
        APIMapeamentosService.deletar_mapeamento_produto(payload)
        flash(f"Mapeamento do produto '{cd_produto_oc3}' removido com sucesso!", "success")
    except Exception as e:
        flash(f"Erro ao excluir mapeamento do produto: {str(e)}", "error")
    return redirect(url_for('mapeamentos.produtos_oc3'))


@mapeamentos_blueprint.route('/api/produtos-sem-mapeamento', methods=['GET'])
@login_required
def api_produtos_sem_mapeamento():
    try:
        dados = APIMapeamentosService.consultar_produtos_sem_mapeamento()
        return jsonify({'success': True, 'data': dados}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ______________________________ Novos Managers ______________________________

@mapeamentos_blueprint.route('/novos-managers', methods=['GET'])
@login_required
def novos_managers():
    mapeamentos = APIMapeamentosService.consultar_mapeamentos_managers()
    pendentes = APIMapeamentosService.consultar_managers_sem_mapeamento()

    return render_template(
        'mapeamentos_novos_managers.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        mapeamentos=mapeamentos,
        pendentes=pendentes
    )


@mapeamentos_blueprint.route('/salvar-manager', methods=['POST'])
@login_required
def salvar_manager():
    try:
        ds_manager = request.form.get('dsManager', '').strip()
        cd_mesa = request.form.get('cdMesa', '').strip()

        if not ds_manager or not cd_mesa:
            flash("O nome do manager e a mesa são obrigatórios.", "error")
            return redirect(url_for('mapeamentos.novos_managers'))

        payload = {
            'dsManager': ds_manager,
            'cdMesa': cd_mesa
        }

        APIMapeamentosService.salvar_mapeamento_manager(payload)
        flash(f"Mapeamento do manager '{ds_manager}' salvo com sucesso!", "success")
    except Exception as e:
        flash(f"Erro ao salvar mapeamento do manager: {str(e)}", "error")

    return redirect(url_for('mapeamentos.novos_managers'))


@mapeamentos_blueprint.route('/deletar-manager', methods=['POST'])
@login_required
def deletar_manager():
    try:
        ds_manager = request.form.get('dsManager', '').strip()
        payload = {'dsManager': ds_manager}
        APIMapeamentosService.deletar_mapeamento_manager(payload)
        flash(f"Mapeamento do manager '{ds_manager}' removido com sucesso!", "success")
    except Exception as e:
        flash(f"Erro ao excluir mapeamento do manager: {str(e)}", "error")

    return redirect(url_for('mapeamentos.novos_managers'))


@mapeamentos_blueprint.route('/api/managers-sem-mapeamento', methods=['GET'])
@login_required
def api_managers_sem_mapeamento():
    try:
        dados = APIMapeamentosService.consultar_managers_sem_mapeamento()
        return jsonify({'success': True, 'data': dados}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
