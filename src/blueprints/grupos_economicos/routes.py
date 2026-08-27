# Importações do projeto
from services.api_grupos_economicos_service import APIGruposEconomicosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
grupos_economicos_blueprint = Blueprint('grupos_economicos', __name__, template_folder='templates', static_folder='static')

# ______________________________ Geral _______________________________________

@grupos_economicos_blueprint.route('/', methods=['GET'])
@login_required
def grupos_economicos():
    return render_template(
        'grupos_economicos.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', '')
    )

# ______________________________ Cadastrar Grupo ______________________________

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
                    'dsEmissorHoldingConsumo': holding_consumo if (i < len(consome_holdings) and consome_holdings[i] == 'sim') else None,

                    # Buscamos o setor cadastrado
                    'dsSetor': setores_list[i].strip() if i < len(setores_list) and setores_list[i] else None, 

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
            return render_template(
                'grupos_economicos_criar.html',
                username=current_user.id,
                grupo=getattr(current_user, 'grupo', ''),
                setores=setores
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

# ______________________________ Consultar Grupo ______________________________

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
                cnpj_raw = str(item.get('cdCnpj') or '').strip()

                emissores.append({
                    'id': id_emissor,
                    'nome': str(item.get('dsEmissor') or '').strip(),
                    'cnpj': 'N/A' if cnpj_raw.lower() in ['nan', 'none', 'null', ''] else cnpj_raw,
                    'is_holding': bool(ic_holding),
                    'parent_id': id_holding if id_holding != 0 else None,
                    'setor': 'N/A' if setor.lower() in ['nan', 'none', 'null', ''] else setor,
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

# ______________________________ Alterar Grupo ______________________________

@grupos_economicos_blueprint.route('/alterar', methods=['GET', 'POST'])
@login_required
def alterar_grupo_economico():
    # Variáveis importantes para a rota
    grupos_cadastrados = APIGruposEconomicosService.get_grupos_economicos_cadastrados()
    setores = APIGruposEconomicosService.obtem_setores_cadastrados()

    grupo_selecionado = None
    dados_grupo = None
    holdings = []
    id_grupo = None

    if request.method == 'POST':
        action = request.form.get('action')

        # Fluxo de Pesquisar Grupo Econômico para Edição
        if action == 'pesquisar':
            try:
                # Começamos buscando o grupo selecionado e seus dados
                grupo_selecionado = request.form.get('dsGrupo', '').strip()
                dados_raw = APIGruposEconomicosService.consultar_grupo_economico({'dsGrupo': grupo_selecionado})

                # Buscamos o id do grupo
                id_grupo = dados_raw[0].get('idGrupo') if dados_raw else None

                # Iteramos pelos emissores 
                dados_grupo = []
                for item in dados_raw:
                    # Começamos buscando o id da holding
                    id_holding = item.get('idEmissorHoldingConsumo')
                    cnpj_raw = str(item.get('cdCnpj') or '').strip()
                    setor_raw = str(item.get('dsSetor') or '').strip()

                    ic_holding_raw = item.get('icHolding')
                    is_holding = bool(ic_holding_raw) and str(ic_holding_raw).lower() not in ['0', 'nao', 'false', 'none', 'null', 'nan']

                    ic_consome_raw = item.get('icConsomeHolding')
                    is_consome = bool(ic_consome_raw) and str(ic_consome_raw).lower() not in ['0', 'nao', 'false', 'none', 'null', 'nan']

                    id_holding_clean = id_holding if id_holding and str(id_holding).lower() not in ['0', 'none', 'nan', 'null'] else None

                    # Montamos o dicionário com os dados do emissor
                    dados_grupo.append({
                        # Nome do emissor e Cnpj
                        'idEmissor': item.get('idEmissor'),
                        'dsEmissor': str(item.get('dsEmissor') or '').strip(),
                        'cdCnpj': '' if cnpj_raw.lower() in ['nan', 'none', 'null', ''] else cnpj_raw,

                        # Buscamos se o emissor é uma holding e se consome de alguma holding
                        'icHolding': 'sim' if is_holding else 'nao',
                        'icConsomeHolding': 'sim' if is_consome else 'nao',
                        'idEmissorHoldingConsumo': id_holding_clean,

                        # Buscamos o setor cadastrado
                        'dsSetor': '' if setor_raw.lower() in ['nan', 'none', 'null', ''] else setor_raw,

                        # Montamos a lista de emissores OC3 e CRIMS
                        'cdEmissoresOC3': item.get('cdEmissoresOC3') if isinstance(item.get('cdEmissoresOC3'), list) else [],
                        'cdEmissoresCRIMS': item.get('cdEmissoresCRIMS') if isinstance(item.get('cdEmissoresCRIMS'), list) else []
                    })

                holdings = [
                    {'id': emissor['idEmissor'], 'nome': emissor['dsEmissor']}
                    for emissor in dados_grupo
                    if emissor['icHolding'] == 'sim' and emissor['dsEmissor']
                ]

            except Exception as e:
                flash(f"Erro ao buscar grupo econômico: {str(e)}", "error")

        # Fluxo de Salvar Alterações do Grupo
        elif action == 'atualizar':
            try:
                # Começamos buscando o id e nome do grupo econômico
                id_grupo = int(request.form.get('idGrupo', '').strip())
                ds_grupo = request.form.get('nomeGrupo', '').strip()

                # Depois pegamos os dados dos emissores
                ids_emissores = request.form.getlist('idEmissor[]')
                cnpjs = request.form.getlist('cnpjEmissor[]')
                nomes = request.form.getlist('nomeEmissor[]')
                is_holdings = request.form.getlist('isHolding[]')
                consome_holdings = request.form.getlist('consomeHolding[]')
                holdings_consumo = request.form.getlist('holdingConsumo[]')
                setores_list = request.form.getlist('setorEmissor[]')
                grupos_destino = request.form.getlist('grupoDestinoEmissor[]')

                # Mapeamento de nome -> id caso algum emissor holding tenha vindo como nome
                nome_to_id = {
                    nomes[j].strip(): int(ids_emissores[j].strip())
                    for j in range(min(len(nomes), len(ids_emissores)))
                    if ids_emissores[j] and ids_emissores[j].strip().isdigit()
                }

                # Iteramos pelos emissores para montar o payload
                emissores = []

                # Vamos iterar pelos emissores e colocar os dados dentro de uma lista
                for i, nome in enumerate(nomes):
                    # Buscamos o id do emissor
                    id_emissor = (
                        int(ids_emissores[i].strip())
                        if i < len(ids_emissores)
                        and ids_emissores[i]
                        and ids_emissores[i].strip().isdigit()
                        else None
                    )

                    # Começamos buscando a holding de consumo do emissor
                    holding_consumo = (
                        int(holdings_consumo[i].strip())
                        if i < len(holdings_consumo)
                        and holdings_consumo[i]
                        and holdings_consumo[i].strip().isdigit()
                        else None
                    )

                    # Buscamos se há grupo de destino para transferência
                    grupo_destino = (
                        grupos_destino[i].strip()
                        if i < len(grupos_destino)
                        and grupos_destino[i]
                        and grupos_destino[i].strip()
                        else None
                    )

                    # Montamos o dicionário com os dados do emissor
                    emissor = {
                        # Nome do emissor, ID e Cnpj
                        'idEmissor': id_emissor,
                        'cdCnpj': cnpjs[i].strip() if i < len(cnpjs) else '',
                        'dsEmissor': nome.strip(),
                        'dsGrupoDestino': grupo_destino,

                        # Buscamos se o emissor é uma holding e se consome de alguma holding
                        'icHolding': int(is_holdings[i] == 'sim'),
                        'icConsomeHolding': int(consome_holdings[i] == 'sim'),
                        'idEmissorHoldingConsumo': holding_consumo if (i < len(consome_holdings) and consome_holdings[i] == 'sim') else None,

                        # Buscamos o setor cadastrado
                        'dsSetor': setores_list[i].strip() if i < len(setores_list) and setores_list[i] else None,

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
                    'idGrupo': id_grupo,
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
        id_grupo=id_grupo,
        dados_grupo=dados_grupo,
        holdings=holdings,
        setores=setores
    )

# ______________________________ Deletar Grupo ______________________________

@grupos_economicos_blueprint.route('/deletar', methods=['POST'])
@grupos_economicos_blueprint.route('/deletar-grupo-economico', methods=['POST'])
@login_required
def deletar_grupo_economico():
    try:
        # Começamos buscando o id grupo
        ds_grupo = request.form.get('dsGrupo')
        id_grupo = request.form.get('idGrupo')

        # Montamos o payload e chamamos o backend
        payload = {'idGrupo': int(id_grupo)}
        APIGruposEconomicosService.deletar_grupo_economico(payload)

        # Redirect + mensagem de sucesso!
        flash(f"Grupo econômico '{ds_grupo}' deletado com sucesso!", "success")
        return redirect(url_for('grupos_economicos.grupos_economicos'))

    except Exception as e:
        flash(f"Erro ao deletar grupo econômico: {str(e)}", "error")
        return redirect(url_for('grupos_economicos.alterar_grupo_economico'))

