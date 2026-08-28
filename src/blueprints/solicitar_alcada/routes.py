# Importações do projeto
from services.api_grupos_economicos_service import APIGruposEconomicosService
from services.api_solicitar_alcada_service import APISolicitarAlcadaService

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


EVENTO_TEMPLATES = {
    'Abertura de Limite': 'solicitar_alcada_abertura.html',
    'Abertura de Sublimite': 'solicitar_alcada_limite_padrao.html',
    'Aumento de Limite': 'solicitar_alcada_limite_padrao.html',
    'Redução de Limite': 'solicitar_alcada_limite_padrao.html',
    'Renovação': 'solicitar_alcada_limite_padrao.html',
    'Renovação com Downgrade de Rating': 'solicitar_alcada_limite_padrao.html',
    'Renovação com Upgrade de Rating': 'solicitar_alcada_limite_padrao.html',
    'Renovação com Downgrade de Rating + Run-Off': 'solicitar_alcada_limite_padrao.html',
    'Renovação com Upgrade de Rating + Run-Off': 'solicitar_alcada_limite_padrao.html',
    'Transferência de Limite entre Mesas': 'solicitar_alcada_limite_padrao.html',
    'Flexibilização': 'solicitar_alcada_flexibilizacao.html',
    'Downgrade de Rating': 'solicitar_alcada_rating.html',
    'Upgrade de Rating': 'solicitar_alcada_rating.html',
    'Downgrade de Rating + Run-Off': 'solicitar_alcada_rating_runoff.html',
    'Upgrade de Rating + Run-Off': 'solicitar_alcada_rating_runoff.html',
    'Run-Off': 'solicitar_alcada_rating_runoff.html',
    'Prorrogação': 'solicitar_alcada_prorrogacao.html',
    'Flexibilização sem Alteração de LMAX': 'solicitar_alcada_flex_sem_lmax.html'
}


@solicitar_alcada_blueprint.route('/solicitar-alcada-formulario', methods=['GET', 'POST'])
@login_required
def solicitar_alcada_formulario():
    if request.method == 'GET':
        try:
            # Começamos buscando os dados importantes para o formulário
            ratings_cadastrados = APISolicitarAlcadaService.get_ratings_distintos_cadastrados()
            grupo_selecionado = request.args.get('grupo_selecionado')
            evento_selecionado = request.args.get('evento_selecionado', '').strip()
            id_solicitacao_raw = request.args.get('idSolicitacao')
            id_solicitacao = int(id_solicitacao_raw) if id_solicitacao_raw and id_solicitacao_raw.isdigit() else None

            # Se idSolicitacao foi informado, buscamos os dados salvos da solicitação
            solicitacao_detalhes = None
            if id_solicitacao:
                try:
                    solicitacao_detalhes = APISolicitarAlcadaService.get_detalhes_solicitacao(id_solicitacao)
                    if not grupo_selecionado and solicitacao_detalhes.get('dsGrupo'):
                        grupo_selecionado = solicitacao_detalhes['dsGrupo']
                    if not evento_selecionado and solicitacao_detalhes.get('dsTipoEvento'):
                        evento_selecionado = solicitacao_detalhes['dsTipoEvento']
                except Exception as e:
                    flash(f"Aviso ao carregar solicitação #{id_solicitacao}: {str(e)}", "warning")

            if not grupo_selecionado or not evento_selecionado:
                flash("Selecione um grupo econômico e um evento válidos.", "warning")
                return redirect(url_for('solicitar_alcada.solicitar_alcada'))

            # Criamos as variáveis auxiliares
            dados_flexibilizacao = []
            emissores_info = []
            grupo_info = {}

            # Montamos o payload para obter limites vigentes do grupo
            payload = {
                'dsGrupo': grupo_selecionado,
                'dsProfile': current_user.grupo
            }
            dados_limites = APISolicitarAlcadaService.get_limites_aprovados_grupo_economico(payload)

            # Mapeamento de limites vigentes atuais por (idEmissor, prazo) e ratings vigentes
            atuais_map = {}
            atuais_ratings_emissor = {}
            cd_rating_grupo_atual = ''
            for row in (dados_limites or []):
                id_e = row.get('idEmissor')
                if not id_e:
                    continue
                if row.get('cdRatingGrupo'):
                    cd_rating_grupo_atual = row.get('cdRatingGrupo')
                if row.get('cdRatingEmissor'):
                    atuais_ratings_emissor[id_e] = row.get('cdRatingEmissor')
                if row.get('vlPrazo') is not None and str(row.get('vlPrazo')).strip() != '':
                    prz = int(float(row['vlPrazo']))
                    atuais_map[(id_e, prz)] = {
                        'vlTerceiros': float(row.get('vlTerceiros') or 0.0),
                        'vlReservaTecnica': float(row.get('vlReservaTecnica') or 0.0)
                    }

            # 1. MODO EDIÇÃO: SOLICITAÇÃO EXISTENTE
            if solicitacao_detalhes:
                vl_share_g = solicitacao_detalhes.get('vlShareDividaGrupo')
                grupo_info = {
                    'dsGrupo': grupo_selecionado,
                    'cdRatingGrupo': cd_rating_grupo_atual or solicitacao_detalhes.get('cdRatingGrupo') or '',
                    'cdRatingGrupoProposto': solicitacao_detalhes.get('cdRatingGrupo') or '',
                    'vlShareDivida': f"{vl_share_g * 100:.2f}".rstrip('0').rstrip('.') if vl_share_g is not None else ''
                }

                emissores_dict = {}
                for e_saved in solicitacao_detalhes.get('emissores', []):
                    id_e = e_saved['idEmissor']
                    vl_share_e = e_saved.get('vlShareDivida')
                    emissores_dict[id_e] = {
                        'idEmissor': id_e,
                        'dsEmissor': e_saved.get('dsEmissor') or '',
                        'cdRatingEmissor': atuais_ratings_emissor.get(id_e, '') or e_saved.get('cdRating') or '',
                        'cdRatingProposto': e_saved.get('cdRating') or '',
                        'vlShareDivida': f"{vl_share_e * 100:.2f}".rstrip('0').rstrip('.') if vl_share_e is not None else '',
                        'icRunOff': int(e_saved.get('icRunOff', 0)),
                        'linhas': [],
                        'meta': e_saved.get('meta')
                    }

                    # Preenche as linhas da proposta salva
                    for linha_salva in e_saved.get('linhas', []):
                        prz = int(linha_salva['vlPrazo'])
                        atual_val = atuais_map.get((id_e, prz), {})
                        emissores_dict[id_e]['linhas'].append({
                            'vlPrazo': prz,
                            'vlTerceiros': atual_val.get('vlTerceiros', 0.0),
                            'vlReservaTecnica': atual_val.get('vlReservaTecnica', 0.0),
                            'vlTerceirosProposto': float(linha_salva.get('vlTerceiros', 0.0)),
                            'vlReservaTecnicaProposto': float(linha_salva.get('vlReservaTecnica', 0.0))
                        })

                # Adiciona emissores cadastrados que não estavam salvos na solicitação
                for row in (dados_limites or []):
                    id_e = row.get('idEmissor')
                    if id_e and id_e not in emissores_dict:
                        emissores_dict[id_e] = {
                            'idEmissor': id_e,
                            'dsEmissor': row.get('dsEmissor') or '',
                            'cdRatingEmissor': row.get('cdRatingEmissor') or '',
                            'cdRatingProposto': row.get('cdRatingEmissor') or '',
                            'vlShareDivida': '',
                            'icRunOff': 0,
                            'linhas': [],
                            'meta': None
                        }

                emissores_info = list(emissores_dict.values())

            # 2. MODO NOVO: ABERTURA DE LIMITE
            elif evento_selecionado == 'Abertura de Limite':
                emissores_dict = {}
                for row in (dados_limites or []):
                    id_emissor = row.get('idEmissor')
                    if id_emissor and id_emissor not in emissores_dict:
                        emissores_dict[id_emissor] = {
                            'idEmissor': id_emissor,
                            'dsEmissor': row.get('dsEmissor') or '',
                            'cdRatingEmissor': '',
                            'cdRatingProposto': '',
                            'vlShareDivida': '',
                            'icRunOff': 0,
                            'linhas': [],
                            'meta': None
                        }

                emissores_info = list(emissores_dict.values())
                grupo_info = {'dsGrupo': grupo_selecionado}

            # 3. MODO NOVO: DEMAIS EVENTOS
            else:
                emissores_dict = {}
                for row in (dados_limites or []):
                    id_emissor = row.get('idEmissor')
                    if not id_emissor:
                        continue

                    if id_emissor not in emissores_dict:
                        emissores_dict[id_emissor] = {
                            'idEmissor': id_emissor,
                            'dsEmissor': row.get('dsEmissor') or '',
                            'cdRatingEmissor': row.get('cdRatingEmissor') or '',
                            'cdRatingProposto': row.get('cdRatingEmissor') or '',
                            'vlShareDivida': '',
                            'icRunOff': 0,
                            'linhas': [],
                            'meta': None
                        }

                    # Extraímos os prazos existentes
                    if row.get('vlPrazo') is not None and str(row.get('vlPrazo')).strip() != '':
                        prazo = int(float(row['vlPrazo']))
                        emissores_dict[id_emissor]['linhas'].append({
                            'vlPrazo': prazo,
                            'vlTerceiros': row.get('vlTerceiros') or 0,
                            'vlReservaTecnica': row.get('vlReservaTecnica') or 0,
                            'vlTerceirosProposto': row.get('vlTerceiros') or 0,
                            'vlReservaTecnicaProposto': row.get('vlReservaTecnica') or 0,
                            'cdRatingEmissor': row.get('cdRatingEmissor') or ''
                        })

                emissores_info = list(emissores_dict.values())
                grupo_info = dados_limites[0] if (dados_limites and len(dados_limites) > 0) else {'dsGrupo': grupo_selecionado}

            # Tratamento para eventos de flexibilização (busca disponíveis em tCRS_0021)
            if evento_selecionado in ['Flexibilização', 'Flexibilização sem Alteração de LMAX']:
                dados_flexibilizacao = APISolicitarAlcadaService.get_disponivel_flexibilizacao_grupo_economico(payload)

            template_escolhido = EVENTO_TEMPLATES.get(evento_selecionado, 'solicitar_alcada_limite_padrao.html')

            return render_template(
                template_escolhido,
                username=current_user.id,
                grupo=current_user.grupo,
                ratings_cadastrados=ratings_cadastrados,
                grupo_selecionado=grupo_selecionado,
                evento_selecionado=evento_selecionado,
                id_solicitacao=id_solicitacao,
                dados_limites=dados_limites,
                dados_flexibilizacao=dados_flexibilizacao,
                grupo_info=grupo_info,
                emissores_info=emissores_info
            )
        except Exception as e:
            flash(f"Erro ao carregar formulário de alçada: {str(e)}", "danger")
            return redirect(url_for('solicitar_alcada.solicitar_alcada'))

    else:
        try:
            action = request.form.get('action')
            if action == 'salvar_alcada':
                id_solicitacao_form = request.form.get('idSolicitacao')
                id_solicitacao = int(id_solicitacao_form) if id_solicitacao_form and id_solicitacao_form.isdigit() else None

                grupo_selecionado = request.form.get('dsGrupo')
                evento_selecionado = request.form.get('dsTipoEvento')

                # Dados do grupo econômico
                rating_grupo = request.form.get('cdRatingGrupoProposto')
                share_grupo = request.form.get('vlShareDividaGrupo')

                # Buscamos os dados dos emissores
                emissores_payload = []
                emissores_indices = set()
                for key in request.form.keys():
                    if key.startswith('emissores['):
                        idx = int(key.split('[')[1].split(']')[0])
                        emissores_indices.add(idx)

                for idx in sorted(list(emissores_indices)):
                    prefixo = f'emissores[{idx}]'

                    ds_emissor = request.form.get(f'{prefixo}[dsEmissor]') or ''
                    cd_rating_emissor = request.form.get(f'{prefixo}[cdRatingProposto]') or ''
                    vl_share_divida = request.form.get(f'{prefixo}[vlShareDivida]')
                    ic_run_off = 1 if request.form.get(f'{prefixo}[icRunOff]') == '1' else 0

                    prazos = request.form.getlist(f'{prefixo}[prazos][]')
                    terceiros = request.form.getlist(f'{prefixo}[terceiros_proposto][]')
                    if not terceiros:
                        terceiros = request.form.getlist(f'{prefixo}[terceiros_atual][]')

                    reservas_tecnicas = request.form.getlist(f'{prefixo}[rts_proposto][]')
                    if not reservas_tecnicas:
                        reservas_tecnicas = request.form.getlist(f'{prefixo}[rts_atual][]')

                    if not prazos and not cd_rating_emissor:
                        continue

                    linhas = []
                    for prazo, terceiro, reserva_tecnica in zip(prazos, terceiros, reservas_tecnicas):
                        if prazo:
                            val_terceiro = float(terceiro) if terceiro not in (None, '') else 0.0
                            val_rt = float(reserva_tecnica) if reserva_tecnica not in (None, '') else 0.0
                            linhas.append({
                                'vlPrazo': int(float(prazo)),
                                'vlTerceiros': val_terceiro,
                                'vlReservaTecnica': val_rt
                            })

                    # Dados de limite meta
                    dt_vencimento_meta = request.form.get(f'{prefixo}[meta][dtVencimento]')
                    cd_rating_meta = request.form.get(f'{prefixo}[meta][cdRating]')
                    share_divida_meta = request.form.get(f'{prefixo}[meta][shareDivida]')

                    meta_rows = []
                    meta_idx = 0
                    while f'{prefixo}[meta][rows][{meta_idx}][prazo]' in request.form:
                        prazo_meta = request.form.get(f'{prefixo}[meta][rows][{meta_idx}][prazo]')
                        terceiros_meta = request.form.get(f'{prefixo}[meta][rows][{meta_idx}][terceiros]')
                        rt_meta = request.form.get(f'{prefixo}[meta][rows][{meta_idx}][rt]')

                        if prazo_meta:
                            meta_rows.append({
                                'prazo': int(float(prazo_meta)),
                                'terceirosProposto': float(terceiros_meta) if terceiros_meta not in (None, '') else 0.0,
                                'rtProposto': float(rt_meta) if rt_meta not in (None, '') else 0.0
                            })
                        meta_idx += 1

                    meta_payload = None
                    if meta_rows:
                        meta_payload = {
                            'dtVencimento': dt_vencimento_meta,
                            'cdRating': cd_rating_meta,
                            'shareDivida': share_divida_meta,
                            'rows': meta_rows
                        }

                    emissores_payload.append({
                        'dsEmissor': ds_emissor,
                        'cdRating': cd_rating_emissor,
                        'vlShareDivida': vl_share_divida,
                        'icRunOff': ic_run_off,
                        'linhas': linhas,
                        'meta': meta_payload
                    })

                payload = {
                    'dsGrupo': grupo_selecionado,
                    'dsTipoEvento': evento_selecionado,
                    'cdRatingGrupo': rating_grupo,
                    'vlShareDivida': share_grupo,
                    'cdUser': current_user.id,
                    'dsProfile': current_user.grupo,
                    'emissores': emissores_payload
                }

                if id_solicitacao:
                    payload['idSolicitacao'] = id_solicitacao
                    APISolicitarAlcadaService.atualizar_solicitacao_alcada(payload)
                    flash(f"Solicitação #{id_solicitacao} ({evento_selecionado}) atualizada com sucesso!", "success")
                    return redirect(url_for('consulta_solicitacoes.consulta_solicitacoes'))
                else:
                    APISolicitarAlcadaService.registrar_solicitacao_alcada(payload)
                    flash(f"Solicitação de alçada ({evento_selecionado}) enviada com sucesso!", "success")
                    return redirect(url_for('solicitar_alcada.solicitar_alcada'))

        except Exception as e:
            flash(f"Erro ao registrar solicitação de alçada: {str(e)}", "danger")
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
