# Importações do projeto
from services.api_solicitar_alcada_service import APISolicitarAlcadaService
from services.api_grupos_economicos_service import APIGruposEconomicosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

# Cria a blueprint
solicitar_alcada_blueprint = Blueprint('solicitar_alcada', __name__, template_folder='templates', static_folder='static')

@solicitar_alcada_blueprint.route('/', methods=['GET', 'POST'])
@login_required
def solicitar_alcada():
    # Começamos criando as variáveis gerais da rota
    grupos_cadastrados = APISolicitarAlcadaService.get_grupos_economicos_cadastrados()
    evento_selecionado = None
    grupo_selecionado = None
    eventos_cadastrados = []

    # Caso o grupo seja selecionado, fazemos um post para buscar os eventos disponíveis
    if request.method == 'POST':
        # Buscamos a action e o grupo selecionado
        action = request.form.get('action')
        grupo_selecionado = request.form.get('dsGrupo')

        if action == 'atualizar_grupos' and grupo_selecionado:
            # Montamos o payload
            payload = {
                'dsGrupo': grupo_selecionado,
                'dsProfile': current_user.grupo
            }

            # Realizamos a requisição
            eventos_cadastrados = APISolicitarAlcadaService.get_tipos_de_eventos_cadastrados(payload)

        # Se a requisição for iniciar_formulario fazemos o redirect
        elif action == 'iniciar_formulario':
            evento_selecionado = request.form.get('evento_selecionado', '').strip()
            if grupo_selecionado and evento_selecionado:
                return redirect(url_for('solicitar_alcada.solicitar_alcada_formulario', grupo_selecionado=grupo_selecionado, evento_selecionado=evento_selecionado))
            else:
                flash("Selecione um grupo econômico e um evento para iniciar.", "warning")

    return render_template(
        'solicitar_alcada.html',
        username=current_user.id,
        grupo=current_user.grupo,
        grupos_cadastrados=grupos_cadastrados,
        eventos_cadastrados=eventos_cadastrados,
        grupo_selecionado=grupo_selecionado,
        evento_selecionado=evento_selecionado
    )


@solicitar_alcada_blueprint.route('/solicitar-alcada-formulario', methods=['GET', 'POST'])
@login_required
def solicitar_alcada_formulario():
    if request.method == 'GET':
        try:
            # Começamos buscando os dados importantes para o formulário
            ratings_cadastrados = APISolicitarAlcadaService.get_ratings_distintos_cadastrados()
            grupo_selecionado = request.args.get('grupo_selecionado')
            evento_selecionado = request.args.get('evento_selecionado', '').strip()

            # Criamos algumas variáveis vazias
            dados_flexibilizacao = []
            dados_limites = None
            emissores_info = []
            grupo_info = {}

            # Montamos o payload
            payload = {
                'dsGrupo': grupo_selecionado,
                'dsProfile': current_user.grupo
            }

            # Buscamos os dados do grupo
            dados_limites = APISolicitarAlcadaService.get_limites_aprovados_grupo_economico(payload)

            # Quando o evento selecionado é abertura de limite 
            if evento_selecionado == 'Abertura de Limite':

                # Criamos a variável auxiliar
                emissores_dict = {}

                # Iteramos pelos emissores, extraindo as informações
                for row in dados_limites:
                    id_emissor = row.get('idEmissor')
                    if id_emissor not in emissores_dict:
                        emissores_dict[id_emissor] = {
                            'idEmissor': id_emissor,
                            'dsEmissor': row.get('dsEmissor') or '',
                            'cdRatingEmissor': '',
                            'linhas': []
                        }

                # Montamos as variáveis do frontend
                emissores_info = list(emissores_dict.values())
                grupo_info = {'dsGrupo': grupo_selecionado}

            # Para outros eventos vamos extrair algumas informações a mais
            else:

                # Criamos a variável auxiliar
                emissores_dict = {}

                # Iteramos pelos emissores, extraindo as informações
                for row in dados_limites:
                    id_emissor = row.get('idEmissor')
                    if id_emissor not in emissores_dict:
                        emissores_dict[id_emissor] = {
                            'idEmissor': id_emissor,
                            'dsEmissor': row.get('dsEmissor') or '',
                            'cdRatingEmissor': '',
                            'linhas': []
                        }

                    # Extraimos os prazos
                    if row.get('vlPrazo') is not None and str(row.get('vlPrazo')).strip() != '':
                        prazo = int(float(row['vlPrazo']))
                        emissores_dict[id_emissor]['linhas'].append({
                            'vlPrazo': prazo,
                            'vlTerceiros': row.get('vlTerceiros') or 0,
                            'vlReservaTecnica': row.get('vlReservaTecnica') or 0,
                            'cdRatingEmissor': row.get('cdRatingEmissor') or ''
                        })

                # Montamos as variáveis do frontend
                emissores_info = list(emissores_dict.values())
                grupo_info = dados_limites[0]

            # Tratamento adicional para flexibilizações
            if evento_selecionado == 'Flexibilização':
                # Montamos o payload 
                payload = {
                    'dsGrupo': grupo_selecionado,
                    'dsProfile': current_user.grupo
                }

                # Buscamos os dados
                dados_flexibilizacao = APISolicitarAlcadaService.get_disponivel_flexibilizacao_grupo_economico({payload})

            return render_template(
                'solicitar_alcada_form.html',
                username=current_user.id,
                grupo=current_user.grupo,
                ratings_cadastrados=ratings_cadastrados,
                grupo_selecionado=grupo_selecionado,
                evento_selecionado=evento_selecionado,
                dados_limites=dados_limites,
                dados_flexibilizacao=dados_flexibilizacao,
                grupo_info=grupo_info,
                emissores_info=emissores_info
            )
        except Exception as e:
            flash(f"Erro ao carregar formulário de alçada: {str(e)}", "warning")
            redirect(url_for('solicitar_alcada.solicitar_alcada'))

    else:
        try:
            # Começamos buscando a action
            action = request.form.get('action')
            if action == 'salvar_alcada':
                # Buscamos os dados do formulário inicial
                grupo_selecionado = request.args.get('grupo_selecionado')
                evento_selecionado = request.args.get('evento_selecionado')

                # Dados do grupo econômico
                rating_grupo = request.form.get('cdRatingGrupoProposto')
                share_grupo = request.form.get('vlShareDividaGrupo')

                # Buscamos os dados dos emissores
                emissores_payload = []

                # Iteramos por cada emissor extraindo os dados
                idx = 0
                while f'emissores[{idx}][idEmissor]' in request.form:
                    # Prefixo dos campos
                    prefixo = f'emissores[{idx}]'

                    # Dados gerais do emissor
                    ds_emissor = request.form.get(f'{prefixo}[dsEmissor]') or ''
                    cd_rating_emissor = request.form.get(f'{prefixo}[cdRatingProposto]') or ''
                    vl_share_divida = request.form.get(f'{prefixo}[vlShareDivida]')
                    ic_run_off = 1 if request.form.get(f'{prefixo}[icRunOff]') == '1' else 0

                    # Linhas de limite
                    prazos = request.form.getlist(f'{prefixo}[prazos][]')
                    terceiros = request.form.getlist(f'{prefixo}[terceiros_proposto][]')
                    reservas_tecnicas = request.form.getlist(f'{prefixo}[rts_proposto][]')

                    linhas = []

                    # Iteramos pelos prazos
                    for prazo, terceiro, reserva_tecnica in zip(
                        prazos,
                        terceiros,
                        reservas_tecnicas
                    ):
    
                        # Guardamos os prazos e os limites
                        linhas.append({
                            'vlPrazo': int(float(prazo)),
                            'vlTerceiros': float(terceiro),
                            'vlReservaTecnica': float(reserva_tecnica)
                        })

                    # Dados de limite meta
                    dt_vencimento_meta = request.form.get(f'{prefixo}[meta][dtVencimento]')
                    cd_rating_meta = request.form.get(f'{prefixo}[meta][cdRating]')
                    share_divida_meta = request.form.get(f'{prefixo}[meta][shareDivida]')

                    # Iteramos pelos prazos do limite meta
                    meta_rows = []
                    meta_idx = 0

                    while f'{prefixo}[meta][rows][{meta_idx}][prazo]' in request.form:
                        # Linhas de limite
                        prazo = request.form.get(f'{prefixo}[meta][rows][{meta_idx}][prazo]')
                        terceiros_meta = request.form.get(f'{prefixo}[meta][rows][{meta_idx}][terceiros]')
                        reserva_tecnica_meta = request.form.get(f'{prefixo}[meta][rows][{meta_idx}][rt]')

                        if prazo:
                            # Guardamos os prazos e os limites
                            meta_rows.append({
                                'prazo': int(float(prazo)),
                                'terceirosProposto': float(terceiros_meta),
                                'rtProposto': float(reserva_tecnica_meta)
                            })

                        meta_idx += 1

                    meta_payload = None

                    # Payload do limite meta
                    if dt_vencimento_meta and meta_rows:
                        meta_payload = {
                            'dtVencimento': dt_vencimento_meta,
                            'cdRating': cd_rating_meta,
                            'shareDivida': share_divida_meta,
                            'rows': meta_rows
                        }

                    # Payload de emissores
                    emissores_payload.append({
                        'dsEmissor': ds_emissor,
                        'cdRating': cd_rating_emissor,
                        'vlShareDivida': vl_share_divida,
                        'icRunOff': ic_run_off,
                        'linhas': linhas,
                        'meta': meta_payload
                    })

                    idx += 1
            
                # Payload final
                payload = {
                    'dsGrupo': grupo_selecionado,
                    'dsTipoEvento': evento_selecionado,
                    'cdRatingGrupo': rating_grupo,
                    'vlShareDivida': share_grupo,
                    'cdUser': current_user.id,
                    'dsProfile': current_user.grupo,
                    'emissores': emissores_payload
                }

            APISolicitarAlcadaService.registrar_solicitacao_alcada(payload)
            flash("Solicitação de alçada enviada com sucesso!", "success")
            return redirect(url_for('solicitar_alcada.solicitar_alcada'))
        except Exception as e:
            flash(f"Erro ao registrar solicitação de alçada: {str(e)}", "error")
            return redirect(url_for('solicitar_alcada.solicitar_alcada'))


@solicitar_alcada_blueprint.route('/api/obtem-tipos-eventos', methods=['GET'])
@solicitar_alcada_blueprint.route('/solicitar-alcada/api/obtem-tipos-eventos', methods=['GET'])
@login_required
def api_obtem_tipos_eventos():
    try:
        ds_grupo = request.args.get('dsGrupo', '').strip()
        if not ds_grupo:
            return jsonify({"success": False, "error": "Grupo econômico não informado.", "data": []}), 400

        filtros = {
            'dsGrupo': ds_grupo,
            'dsProfile': getattr(current_user, 'grupo', '')
        }
        dados = APISolicitarAlcadaService.get_tipos_de_eventos_cadastrados(filtros=filtros)
        return jsonify({"success": True, "data": dados})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "data": []}), 500
