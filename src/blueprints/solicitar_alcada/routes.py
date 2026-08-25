# Importações do projeto
from services.api_solicitar_alcada_service import APISolicitarAlcadaService
from services.api_grupos_economicos_service import APIGruposEconomicosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user
import re


def _parse_float(val):
    if val is None:
        return None
    val_str = str(val).strip()
    if not val_str:
        return None
    if ',' in val_str:
        val_str = val_str.replace('.', '').replace(',', '.')
    try:
        return float(val_str)
    except (ValueError, TypeError):
        return None


def _parse_int(val):
    if val is None:
        return None
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return None


# Cria a blueprint
solicitar_alcada_blueprint = Blueprint('solicitar_alcada', __name__, template_folder='templates', static_folder='static')

# ______________________________ Solicitar Alçada ______________________________

@solicitar_alcada_blueprint.route('/', methods=['GET', 'POST'])
@login_required
def solicitar_alcada():
    # Variáveis gerais da página
    grupos_cadastrados = []
    eventos_cadastrados = []
    ratings_cadastrados = []
    grupo_selecionado = None
    id_tipo_evento_selecionado = None
    ds_tipo_evento = None
    dados_limites = None
    dados_flexibilizacao = []
    grupo_info = {}
    emissores_info = []

    try:
        grupos_cadastrados = APISolicitarAlcadaService.get_grupos_economicos_cadastrados()
    except Exception as e:
        flash(f"Erro ao carregar grupos econômicos: {str(e)}", "error")

    try:
        ratings_cadastrados = APISolicitarAlcadaService.get_ratings_distintos_cadastrados()
    except Exception as e:
        flash(f"Erro ao carregar ratings: {str(e)}", "error")

    if request.method == 'POST':
        action = request.form.get('action')

        # ____________________ Ação: Salvar Solicitação de Alçada ____________________
        if action == 'salvar':
            try:
                grupo_selecionado = request.form.get('dsGrupo')
                id_tipo_evento = _parse_int(request.form.get('idTipoEvento'))
                ds_tipo_evento = request.form.get('dsTipoEvento')
                cd_rating_grupo = request.form.get('cdRatingGrupoProposto')
                vl_share_grupo = _parse_float(request.form.get('vlShareDividaGrupo'))

                # Identifica todos os índices de emissores presentes no formulário
                emissor_indices = set()
                for key in request.form.keys():
                    match = re.match(r'emissores\[(\d+)\]', key)
                    if match:
                        emissor_indices.add(int(match.group(1)))

                emissores_payload = []
                for idx in sorted(emissor_indices):
                    id_em = _parse_int(request.form.get(f'emissores[{idx}][idEmissor]')) or 1
                    ds_em = request.form.get(f'emissores[{idx}][dsEmissor]') or ''
                    cd_rat_em = request.form.get(f'emissores[{idx}][cdRatingProposto]') or ''
                    vl_sh_em = _parse_float(request.form.get(f'emissores[{idx}][vlShareDivida]'))
                    ic_ro = 1 if request.form.get(f'emissores[{idx}][icRunOff]') == '1' else 0

                    prazos = request.form.getlist(f'emissores[{idx}][prazos][]')
                    terceiros = request.form.getlist(f'emissores[{idx}][terceiros_proposto][]')
                    rts = request.form.getlist(f'emissores[{idx}][rts_proposto][]')

                    linhas = []
                    for p, t, r in zip(prazos, terceiros, rts):
                        p_val = _parse_int(p)
                        if p_val is not None:
                            linhas.append({
                                'vlPrazo': p_val,
                                'vlTerceiros': _parse_float(t) or 0.0,
                                'vlReservaTecnica': _parse_float(r) or 0.0
                            })

                    # Limite Meta (se configurado)
                    dt_venc_meta = request.form.get(f'emissores[{idx}][meta][dtVencimento]')
                    cd_rat_meta = request.form.get(f'emissores[{idx}][meta][cdRating]')
                    sh_meta = _parse_float(request.form.get(f'emissores[{idx}][meta][shareDivida]'))

                    meta_row_indices = set()
                    for key in request.form.keys():
                        m_match = re.match(rf'emissores\[{idx}\]\[meta\]\[rows\]\[(\d+)\]', key)
                        if m_match:
                            meta_row_indices.add(int(m_match.group(1)))

                    meta_rows = []
                    for m_idx in sorted(meta_row_indices):
                        mp = _parse_int(request.form.get(f'emissores[{idx}][meta][rows][{m_idx}][prazo]'))
                        mt = _parse_float(request.form.get(f'emissores[{idx}][meta][rows][{m_idx}][terceiros]'))
                        mr = _parse_float(request.form.get(f'emissores[{idx}][meta][rows][{m_idx}][rt]'))
                        if mp is not None:
                            meta_rows.append({
                                'prazo': mp,
                                'terceirosProposto': mt or 0.0,
                                'rtProposto': mr or 0.0
                            })

                    meta_payload = None
                    if dt_venc_meta and meta_rows:
                        meta_payload = {
                            'dtVencimento': dt_venc_meta,
                            'cdRating': cd_rat_meta,
                            'shareDivida': sh_meta,
                            'rows': meta_rows
                        }

                    emissores_payload.append({
                        'idEmissor': id_em,
                        'dsEmissor': ds_em,
                        'cdRating': cd_rat_em,
                        'vlShareDivida': vl_sh_em,
                        'icRunOff': ic_ro,
                        'linhas': linhas,
                        'meta': meta_payload
                    })

                payload = {
                    'dsGrupo': grupo_selecionado,
                    'idTipoEvento': id_tipo_evento,
                    'dsTipoEvento': ds_tipo_evento,
                    'cdRatingGrupo': cd_rating_grupo,
                    'vlShareDivida': vl_share_grupo,
                    'cdUser': getattr(current_user, 'id', '') or str(current_user),
                    'dsProfile': getattr(current_user, 'grupo', ''),
                    'emissores': emissores_payload
                }

                # Chama o serviço para envio à API do backend
                APISolicitarAlcadaService.registrar_solicitacao_alcada(payload)
                flash("Solicitação de alçada enviada com sucesso!", "success")
                return redirect(url_for('solicitar_alcada.solicitar_alcada'))
            except Exception as e:
                flash(f"Erro ao registrar solicitação de alçada: {str(e)}", "error")

        # ____________________ Ação: Iniciar / Carregar Grupo e Evento ____________________
        else:
            try:
                grupo_selecionado = request.form.get('dsGrupo')
                id_tipo_evento_selecionado = request.form.get('idTipoEvento')

                if grupo_selecionado:
                    try:
                        eventos_cadastrados = APISolicitarAlcadaService.get_tipos_de_eventos_cadastrados({
                            'dsGrupo': grupo_selecionado,
                            'dsProfile': getattr(current_user, 'grupo', '')
                        })
                    except Exception as e:
                        flash(f"Erro ao carregar tipos de eventos: {str(e)}", "error")

                    # Localiza a descrição do tipo de evento selecionado
                    if eventos_cadastrados and id_tipo_evento_selecionado:
                        for ev in eventos_cadastrados:
                            ev_id = str(ev.get('idTipoEvento') or ev.get('idEvento') or ev.get('id') or '')
                            if ev_id == str(id_tipo_evento_selecionado):
                                ds_tipo_evento = ev.get('dsTipoEvento') or ev.get('dsEvento') or ev.get('nome') or ''
                                break

                    # 1. Evento "Abertura de Limite": NÃO consulta o backend de limites vigentes
                    if ds_tipo_evento == 'Abertura de Limite':
                        try:
                            dados_grupo = APIGruposEconomicosService.consultar_grupo_economico({'dsGrupo': grupo_selecionado})
                            emissores_info = []
                            if dados_grupo:
                                for item in dados_grupo:
                                    if not item.get('icConsomeHolding'):
                                        emissores_info.append({
                                            'idEmissor': item.get('idEmissor'),
                                            'dsEmissor': item.get('dsEmissor'),
                                            'cdRatingEmissor': '',
                                            'linhas': []
                                        })
                            if not emissores_info:
                                emissores_info = [{'idEmissor': 1, 'dsEmissor': grupo_selecionado, 'linhas': []}]
                            grupo_info = {'dsGrupo': grupo_selecionado}
                        except Exception as e:
                            emissores_info = [{'idEmissor': 1, 'dsEmissor': grupo_selecionado, 'linhas': []}]
                            grupo_info = {'dsGrupo': grupo_selecionado}

                    # 2. Outros Eventos: consulta limites aprovados vigentes
                    else:
                        try:
                            dados_limites = APISolicitarAlcadaService.get_limites_aprovados_grupo_economico({
                                'dsGrupo': grupo_selecionado,
                                'dsProfile': getattr(current_user, 'grupo', '')
                            })
                        except Exception as e:
                            dados_limites = None
                            flash(f"Aviso: Não foi possível carregar os limites aprovados ({str(e)}). O formulário foi inicializado para preenchimento.", "warning")

                        if dados_limites and isinstance(dados_limites, list):
                            emissores_dict = {}
                            for row in dados_limites:
                                id_em = row.get('idEmissor') or 1
                                if id_em not in emissores_dict:
                                    emissores_dict[id_em] = {
                                        'idEmissor': id_em,
                                        'dsEmissor': row.get('dsEmissor') or f"Emissor #{id_em}",
                                        'cdRatingEmissor': row.get('cdRatingEmissor') or '',
                                        'cdRatingGrupo': row.get('cdRatingGrupo') or '',
                                        'linhas': []
                                    }
                                if row.get('vlPrazo') is not None and str(row.get('vlPrazo')).strip() != '':
                                    try:
                                        prazo_num = float(row['vlPrazo'])
                                        prazo_val = int(prazo_num) if prazo_num.is_integer() else prazo_num
                                    except (ValueError, TypeError):
                                        prazo_val = row.get('vlPrazo')

                                    emissores_dict[id_em]['linhas'].append({
                                        'vlPrazo': prazo_val,
                                        'vlTerceiros': row.get('vlTerceiros') or 0,
                                        'vlReservaTecnica': row.get('vlReservaTecnica') or 0,
                                        'cdRatingEmissor': row.get('cdRatingEmissor') or ''
                                    })
                            emissores_info = list(emissores_dict.values())
                            grupo_info = dados_limites[0] if len(dados_limites) > 0 else {'dsGrupo': grupo_selecionado}
                        else:
                            try:
                                dados_grupo = APIGruposEconomicosService.consultar_grupo_economico({'dsGrupo': grupo_selecionado})
                                emissores_info = [
                                    {'idEmissor': item.get('idEmissor'), 'dsEmissor': item.get('dsEmissor'), 'cdRatingEmissor': '', 'linhas': []}
                                    for item in dados_grupo if not item.get('icConsomeHolding')
                                ]
                            except Exception:
                                emissores_info = []
                            if not emissores_info:
                                emissores_info = [{'idEmissor': 1, 'dsEmissor': grupo_selecionado, 'linhas': []}]
                            grupo_info = {'dsGrupo': grupo_selecionado}

                    # 3. Evento "Flexibilização": consulta disponível para flexibilização
                    if ds_tipo_evento == 'Flexibilização':
                        try:
                            dados_flexibilizacao = APISolicitarAlcadaService.get_disponivel_flexibilizacao_grupo_economico({
                                'dsGrupo': grupo_selecionado,
                                'dsProfile': getattr(current_user, 'grupo', '')
                            })
                        except Exception as e:
                            dados_flexibilizacao = []
                            flash(f"Aviso: Não foi possível carregar o disponível para flexibilização ({str(e)}).", "warning")

            except Exception as e:
                flash(f"Erro ao processar solicitação: {str(e)}", "error")

    return render_template(
        'solicitar_alcada.html',
        username=current_user.id,
        grupo=getattr(current_user, 'grupo', ''),
        grupos_cadastrados=grupos_cadastrados,
        eventos_cadastrados=eventos_cadastrados,
        ratings_cadastrados=ratings_cadastrados,
        grupo_selecionado=grupo_selecionado,
        id_tipo_evento_selecionado=id_tipo_evento_selecionado,
        ds_tipo_evento=ds_tipo_evento,
        dados_limites=dados_limites,
        dados_flexibilizacao=dados_flexibilizacao,
        grupo_info=grupo_info,
        emissores_info=emissores_info
    )


# ______________________________ API Auxiliar ______________________________

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



