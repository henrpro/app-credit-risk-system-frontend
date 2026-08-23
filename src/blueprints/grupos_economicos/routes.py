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
    # Variaveis importantes para a página
    grupos_cadastrados = APIGruposEconomicosService.get_grupos_economicos_cadastrados()
    grupo_selecionado = None
    organograma = None

    if request.method == 'POST':
        try:
            # Começamos buscando o grupo selecionado e seus dados
            grupo_selecionado = request.form.get('dsGrupo', '').strip()
            dados_grupo = APIGruposEconomicosService.consultar_grupo_economico({'dsGrupo': grupo_selecionado})
            
            # Iteramos pelos emissores 
            emissores = []
            for item in dados_grupo:
                # Buscamos o id do emissor e da holding de consumo
                id_emissor = item.get('idEmissor')
                id_holding = item.get('idEmissorHoldingConsumo')
                ic_holding = item.get('icHolding')

                # Buscamos os dados do modal
                oc3 = ', '.join(item.get('cdEmissoresOC3')) if item.get('cdEmissoresOC3') else 'N/A'
                crims = ', '.join(item.get('cdEmissoresCRIMS')) if item.get('cdEmissoresCRIMS') else 'N/A'
                papeis = item.get('cdAtivosConsumos') if isinstance(item.get('cdAtivosConsumos'), dict) else {}

                setor = str(item.get('dsSetor') or '').strip()
                subsetor = str(item.get('dsSubsetor') or '').strip()

                emissores.append({
                    'id': id_emissor,
                    'nome': str(item.get('dsEmissor') or '').strip(),
                    'cnpj': str(item.get('cdCnpj') or '').strip(),
                    'is_holding': bool(ic_holding),
                    'parent_id': id_holding if id_holding != 0 else None,
                    'setor': 'N/A' if setor.lower() in ['nan', 'none', 'null', ''] else setor,
                    'subsetor': 'N/A' if subsetor.lower() in ['nan', 'none', 'null', ''] else subsetor,
                    'oc3': oc3,
                    'crims': crims,
                    'papeis': papeis
                })

            # Separamos as holdings
            holdings = [
                emissor
                for emissor in emissores
                if emissor['is_holding']
            ]

            # Montamos um conjunto de mapeamento com os IDs das holdings
            ids_holdings = {
                holding['id']
                for holding in holdings
            }

            # Separamos os emissores independentes
            independentes = [
                emissor
                for emissor in emissores
                if not emissor['is_holding']
                and (not emissor['parent_id'] or emissor['parent_id'] not in ids_holdings)
            ]

            # Montamos a hierarquia
            for holding in holdings:
                holding['children'] = [
                    emissor
                    for emissor in emissores
                    if emissor['parent_id'] == holding['id']
                ]

            top_holdings = [
                holding
                for holding in holdings
                if not holding['parent_id']
                or holding['parent_id'] not in ids_holdings
            ]

            # Coletamos os papéis de consumo de todos os emissores do grupo
            papeis_grupo = {}
            for emissor in emissores:
                if emissor.get('papeis') and isinstance(emissor['papeis'], dict):
                    for papel, consumo in emissor['papeis'].items():
                        papeis_grupo[papel] = consumo

            organograma = {
                'nome_grupo': grupo_selecionado,
                'holdings': top_holdings,
                'independentes': independentes,
                'total_emissores': len(emissores),
                'papeis': papeis_grupo
            }

        except Exception as e:
            flash(f"Erro ao consultar grupo econômico: {str(e)}", "error")

    return render_template(
        'grupos_economicos_consultar.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        grupos_cadastrados=grupos_cadastrados,
        organograma=organograma,
        ds_grupo_selecionado=grupo_selecionado
    )

@grupos_economicos_blueprint.route('/alterar', methods=['GET', 'POST'])
@login_required
def alterar_grupo_economico():
    grupos_cadastrados = APIGruposEconomicosService.get_grupos_economicos_cadastrados()
    setores = APIGruposEconomicosService.obtem_setores_cadastrados()
    subsetores = APIGruposEconomicosService.obtem_subsetores_cadastrados()

    grupo_selecionado = None
    dados_grupo = None
    holdings_nomes = []

    if request.method == 'POST':
        action = request.form.get('action')

        # Fluxo de Pesquisar Grupo Econômico para Edição
        if action == 'pesquisar':
            try:
                grupo_selecionado = request.form.get('dsGrupo', '').strip()
                dados_raw = APIGruposEconomicosService.consultar_grupo_economico({'dsGrupo': grupo_selecionado})

                # Mapeamento de idEmissor para dsEmissor para identificar a holding de consumo pelo nome
                id_to_nome = {
                    item.get('idEmissor'): str(item.get('dsEmissor') or '').strip()
                    for item in dados_raw
                    if item.get('idEmissor')
                }

                dados_grupo = []
                for item in dados_raw:
                    id_holding = item.get('idEmissorHoldingConsumo')
                    holding_nome = id_to_nome.get(id_holding) if id_holding and id_holding != 0 else ''

                    dados_grupo.append({
                        'idEmissor': item.get('idEmissor'),
                        'dsEmissor': str(item.get('dsEmissor') or '').strip(),
                        'cdCnpj': str(item.get('cdCnpj') or '').strip(),
                        'icHolding': 'sim' if item.get('icHolding') else 'nao',
                        'icConsomeHolding': 'sim' if item.get('icConsomeHolding') else 'nao',
                        'dsEmissorHoldingConsumo': holding_nome or 'Nenhuma',
                        'dsSetor': str(item.get('dsSetor') or '').strip(),
                        'dsSubsetor': str(item.get('dsSubsetor') or '').strip(),
                        'cdEmissoresOC3': item.get('cdEmissoresOC3') if isinstance(item.get('cdEmissoresOC3'), list) else [],
                        'cdEmissoresCRIMS': item.get('cdEmissoresCRIMS') if isinstance(item.get('cdEmissoresCRIMS'), list) else []
                    })

                holdings_nomes = [
                    emissor['dsEmissor']
                    for emissor in dados_grupo
                    if emissor['icHolding'] == 'sim' and emissor['dsEmissor']
                ]

            except Exception as e:
                flash(f"Erro ao buscar grupo econômico: {str(e)}", "error")

        # Fluxo de Salvar Alterações do Grupo
        elif action == 'atualizar':
            try:
                ds_grupo = request.form.get('nomeGrupo', '').strip()
                cnpjs = request.form.getlist('cnpjEmissor[]')
                nomes = request.form.getlist('nomeEmissor[]')
                is_holdings = request.form.getlist('isHolding[]')
                consome_holdings = request.form.getlist('consomeHolding[]')
                holdings_consumo = request.form.getlist('holdingConsumo[]')
                setores_list = request.form.getlist('setorEmissor[]')
                subsetores_list = request.form.getlist('subsetorEmissor[]')

                emissores = []
                for i, nome in enumerate(nomes):
                    holding_consumo = (
                        holdings_consumo[i].strip()
                        if i < len(holdings_consumo) and holdings_consumo[i] and holdings_consumo[i] != 'Nenhuma'
                        else None
                    )

                    emissor = {
                        'cdCnpj': cnpjs[i].strip() if i < len(cnpjs) else '',
                        'dsEmissor': nome.strip(),
                        'icHolding': int(is_holdings[i] == 'sim'),
                        'icConsomeHolding': int(consome_holdings[i] == 'sim'),
                        'dsEmissorHoldingConsumo': holding_consumo,
                        'dsSetor': setores_list[i].strip() if i < len(setores_list) and setores_list[i] else None,
                        'dsSubsetor': subsetores_list[i].strip() if i < len(subsetores_list) and subsetores_list[i] else None,
                        'cdEmissoresOC3': request.form.getlist(f'emissores[{i}][oc3_codigos][]'),
                        'cdEmissoresCRIMS': request.form.getlist(f'emissores[{i}][crims_codigos][]')
                    }
                    emissores.append(emissor)

                payload = {
                    'dsGrupo': ds_grupo,
                    'emissores': emissores
                }

                APIGruposEconomicosService.atualizar_grupo_economico(payload)
                flash("Grupo econômico atualizado com sucesso!", "success")
                return redirect(url_for('grupos_economicos.grupos_economicos'))

            except Exception as e:
                flash(f"{str(e)}", "error")

    return render_template(
        'grupos_economicos_alterar.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        grupos_cadastrados=grupos_cadastrados,
        grupo_selecionado=grupo_selecionado,
        dados_grupo=dados_grupo,
        holdings_nomes=holdings_nomes,
        setores=setores,
        subsetores=subsetores
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