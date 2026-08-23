# Importações do projeto
from services.api_grupos_economicos_service import APIGruposEconomicosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
grupos_economicos_blueprint = Blueprint('grupos_economicos', __name__, template_folder='templates', static_folder='static')

@grupos_economicos_blueprint.route('/', methods=['GET'])
@login_required
def grupos_economicos():
    return render_template(
        'grupos_economicos.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )

@grupos_economicos_blueprint.route('/consultar', methods=['GET', 'POST'])
@login_required
def consultar_grupo_economico():
    if request.method == 'POST':
        # Começamos buscando os grupos econômicos cadastrados
        grupos_cadastrados = APIGruposEconomicosService.get_grupos_economicos_cadastrados()

        # Buscamos o nome do grupo econômico pesquisado
        ds_grupo = 

        # Em sequência buscamos a estrutura do grupo econômico
        grupo = APIGruposEconomicosService.consultar_grupo_economico()

        # Montamos a estrutura do grupo econômico para o organograma


        # Renderizamos o template 
        return render_template(
            'grupos_economicos_consultar.html',
            username=current_user.id,
            grupo=getattr(current_user, 'grupo', ''),
            grupos_cadastrados=grupos_cadastrados
        )

    else:
        try:
            # Começamos buscando os grupos econômicos cadastrados
            grupos_cadastrados = APIGruposEconomicosService.get_grupos_economicos_cadastrados()

            # Retornamos rederizando o 
            return render_template(
                'grupos_economicos_consultar.html',
                username=current_user.id,
                grupo=getattr(current_user, 'grupo', ''),
                grupos_cadastrados=grupos_cadastrados
            )

        except Exception as e:
            flash(f"{str(e)}", "error")
            return redirect(url_for('grupos_economicos.grupos_economicos'))

    return render_template(
        'grupos_economicos_consultar.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        grupos_cadastrados=grupos_cadastrados
    )

@grupos_economicos_blueprint.route('/alterar', methods=['GET', 'POST'])
@login_required
def alterar_grupo_economico():
    return render_template(
        'grupos_economicos_alterar.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )

@grupos_economicos_blueprint.route('/criar', methods=['GET', 'POST'])
@login_required
def criar_grupo_economico():
    if request.method == 'POST':
        try:
            # Começamos buscando o nome do grupo econômico
            ds_grupo = request.form.get('nomeGrupo', '').strip()

            # Depois pegamos os dados dos emissores
            cnpjs = request.form.getlist('cnpjEmissor[]')
            nomes = request.form.getlist('nomeEmissor[]')
            is_holdings = request.form.getlist('isHolding[]')
            consome_holdings = request.form.getlist('consomeHolding[]')
            holdings_consumo = request.form.getlist('holdingConsumo[]')
            setores_list = request.form.getlist('setorEmissor[]')
            subsetores_list = request.form.getlist('subsetorEmissor[]')

            emissores = []

            # Vamos iterar pelos emissores e colocar os dados dentro de uma lista
            for i, nome in enumerate(nomes):
                # Começamos buscando a holding de consumo do emissor
                holding_consumo = ( 
                    holdings_consumo[i].strip() 
                    if i < len(holdings_consumo) 
                    and holdings_consumo[i] 
                    and holdings_consumo[i] != 'Nenhuma' 
                    else None 
                    )

                # Montamos o dicionário com os dados do emissor
                emissor = { 
                    # Nome do emissor e Cnpj
                    'cdCnpj': cnpjs[i].strip() if i < len(cnpjs) else '', 
                    'dsEmissor': nome.strip(),

                    # Buscamos se o emissor é uma holding e se consome de alguma holding
                    'icHolding': int(is_holdings[i] == 'sim'), 
                    'icConsomeHolding': int(consome_holdings[i] == 'sim'),
                    'dsEmissorHoldingConsumo': holding_consumo,

                    # Buscamos o setor e subsetor cadastrados
                    'dsSetor': setores_list[i].strip() if i < len(setores_list) and setores_list[i] else None, 
                    'dsSubsetor': subsetores_list[i].strip() if i < len(subsetores_list) and subsetores_list[i] else None, 

                    # Montamos a lista de emissores OC3 e CRIMS
                    'cdEmissoresOC3': request.form.getlist( 
                        f'emissores[{i}][oc3_codigos][]' 
                    ), 
                    'cdEmissoresCRIMS': request.form.getlist( 
                        f'emissores[{i}][crims_codigos][]' 
                    ) 
                } 
                
                emissores.append(emissor)

            payload = {
                'dsGrupo': ds_grupo,
                'emissores': emissores
            }
            
            resposta = APIGruposEconomicosService.registrar_grupo_economico(payload)
            flash("Grupo econômico cadastrado com sucesso!", "success")
            return redirect(url_for('grupos_economicos.grupos_economicos'))
        except Exception as e:
            flash(f"{str(e)}", "error")
            return redirect(url_for('grupos_economicos.grupos_economicos'))
            
    else:
        try:
            setores = APIGruposEconomicosService.obtem_setores_cadastrados()
            subsetores = APIGruposEconomicosService.obtem_subsetores_cadastrados()
            return render_template(
                'grupos_economicos_criar.html',
                username=current_user.id,
                grupo=getattr(current_user, 'grupo', ''),
                setores=setores,
                subsetores=subsetores
            )
        except Exception as e:
            return redirect(url_for('grupos_economicos.grupos_economicos'))

@grupos_economicos_blueprint.route('/api/emissores-oc3', methods=['GET'])
@grupos_economicos_blueprint.route('/grupos-economicos/api/emissores-oc3', methods=['GET'])
@login_required
def api_obtem_emissores_oc3():
    try:
        filtros = request.args.to_dict()
        dados = APIGruposEconomicosService.obtem_emissores_oc3(filtros=filtros)
        return jsonify({"success": True, "data": dados})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "data": []}), 500

@grupos_economicos_blueprint.route('/api/emissores-crims', methods=['GET'])
@grupos_economicos_blueprint.route('/grupos-economicos/api/emissores-crims', methods=['GET'])
@login_required
def api_obtem_emissores_crims():
    try:
        filtros = request.args.to_dict()
        dados = APIGruposEconomicosService.obtem_emissores_crims(filtros=filtros)
        return jsonify({"success": True, "data": dados})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "data": []}), 500