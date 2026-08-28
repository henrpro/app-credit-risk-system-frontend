document.addEventListener('DOMContentLoaded', function () {
    // -------------------------------------------------------------------------
    // 1. UTILITÁRIOS DE FORMATAÇÃO E PARSE
    // -------------------------------------------------------------------------
    function parseVal(val) {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        let s = String(val).trim();
        if (s === '') return 0;
        if (s.includes(',')) {
            s = s.replace(/\./g, '').replace(',', '.');
        }
        const num = parseFloat(s);
        return isNaN(num) ? 0 : num;
    }

    function formatNumber(num) {
        if (isNaN(num) || num === null || num === undefined) num = 0;
        return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // -------------------------------------------------------------------------
    // 2. FILTRAGEM EM TEMPO REAL NA TABELA PRINCIPAL
    // -------------------------------------------------------------------------
    const inputFiltro = document.getElementById('filtroAlcadas');
    const contadorAlcadas = document.getElementById('contadorAlcadas');
    const tabelaRows = document.querySelectorAll('.alcada-row');
    const emptyFiltro = document.getElementById('emptyFiltroAlcadas');

    function aplicarFiltros() {
        const termo = (inputFiltro ? inputFiltro.value : '').toLowerCase().trim();
        let visiveis = 0;

        tabelaRows.forEach(row => {
            const id = (row.dataset.id || '').toLowerCase();
            const grupo = (row.dataset.grupo || '').toLowerCase();
            const nome = (row.dataset.nome || '').toLowerCase();
            const mesa = (row.dataset.mesa || '').toLowerCase();
            const evento = (row.dataset.evento || '').toLowerCase();

            const textoCompleto = `${id} ${grupo} ${nome} ${mesa} ${evento}`;
            const matches = !termo || textoCompleto.includes(termo);

            if (matches) {
                row.style.display = '';
                visiveis++;
            } else {
                row.style.display = 'none';
            }
        });

        if (contadorAlcadas) {
            contadorAlcadas.textContent = visiveis;
        }

        if (emptyFiltro) {
            if (visiveis === 0 && tabelaRows.length > 0) {
                emptyFiltro.classList.remove('d-none');
            } else {
                emptyFiltro.classList.add('d-none');
            }
        }
    }

    if (inputFiltro) inputFiltro.addEventListener('input', aplicarFiltros);

    // -------------------------------------------------------------------------
    // 3. RENDERIZADORES DE TABELA DO MODAL
    // -------------------------------------------------------------------------
    function renderTabelaConsolidadaSimples(linhas, labelRt = 'RT', emptyMsg = 'Nenhum limite solicitado') {
        if (!Array.isArray(linhas) || linhas.length === 0) {
            return `<tr><td colspan="4" class="text-center text-muted py-3">${emptyMsg}</td></tr>`;
        }

        return linhas.map(l => {
            const prazo = `${l.vlPrazo} ano(s)`;
            const terc = parseVal(l.vlTerceiros);
            const rtMult = parseVal(l.vlMultimesas !== undefined ? l.vlMultimesas : l.vlReservaTecnica);
            const total = terc + rtMult;

            return `
                <tr>
                    <td class="td-prazo">${prazo}</td>
                    <td class="td-val text-end fw-bold text-accent">${formatNumber(total)}</td>
                    <td class="td-val text-end">${formatNumber(terc)}</td>
                    <td class="td-val text-end">${formatNumber(rtMult)}</td>
                </tr>
            `;
        }).join('');
    }

    function renderTabelaMesaSimples(linhas, labelRt = 'RT', emptyMsg = 'Nenhum limite solicitado') {
        if (!Array.isArray(linhas) || linhas.length === 0) {
            return `<tr><td colspan="3" class="text-center text-muted py-3">${emptyMsg}</td></tr>`;
        }

        return linhas.map(l => {
            const prazo = `${l.vlPrazo} ano(s)`;
            const terc = parseVal(l.vlTerceiros);
            const rtMult = parseVal(l.vlMultimesas !== undefined ? l.vlMultimesas : l.vlReservaTecnica);

            return `
                <tr>
                    <td class="td-prazo">${prazo}</td>
                    <td class="td-val text-end">${formatNumber(terc)}</td>
                    <td class="td-val text-end">${formatNumber(rtMult)}</td>
                </tr>
            `;
        }).join('');
    }

    function renderBlocoConsolidadoComMeta(titulo, linhasNormal, linhasMeta, labelRt = 'RT', emptyMsg = 'Nenhum limite solicitado') {
        const hasMeta = Array.isArray(linhasMeta) && linhasMeta.length > 0;
        return `
            <div class="detail-section-card mb-4">
                <h6 class="detail-section-title mb-3">
                    <i class="bi bi-building-gear text-accent me-2"></i>${titulo}
                </h6>
                <div class="table-responsive mb-2">
                    <table class="table modal-detail-table align-middle">
                        <thead>
                            <tr>
                                <th class="th-center" style="width: 15%;">Prazo</th>
                                <th class="th-val text-end" style="width: 25%;">Total</th>
                                <th class="th-val text-end" style="width: 30%;">Terceiros</th>
                                <th class="th-val text-end" style="width: 30%;">${labelRt}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderTabelaConsolidadaSimples(linhasNormal, labelRt, emptyMsg)}
                        </tbody>
                    </table>
                </div>

                ${hasMeta ? `
                    <div class="mt-3">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-warning-subtle text-warning border border-warning px-2 py-1 small">
                                <i class="bi bi-bullseye me-1"></i>Limite Meta Solicitado
                            </span>
                        </div>
                        <div class="table-responsive">
                            <table class="table modal-detail-table align-middle">
                                <thead>
                                    <tr>
                                        <th class="th-center" style="width: 15%;">Prazo</th>
                                        <th class="th-val text-end" style="width: 25%;">Total Meta</th>
                                        <th class="th-val text-end" style="width: 30%;">Terceiros Meta</th>
                                        <th class="th-val text-end" style="width: 30%;">${labelRt} Meta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${renderTabelaConsolidadaSimples(linhasMeta, labelRt, emptyMsg)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function renderBlocoMesaComMeta(tituloMesa, linhasNormal, linhasMeta, labelRt = 'RT', emptyMsg = 'Nenhum limite solicitado') {
        const hasMeta = Array.isArray(linhasMeta) && linhasMeta.length > 0;
        return `
            <div class="mesa-subcard mb-3">
                <div class="mesa-subcard-header">
                    <h6 class="mesa-subcard-title">
                        <i class="bi bi-layers text-accent"></i> ${tituloMesa}
                    </h6>
                </div>
                <div class="table-responsive mb-2">
                    <table class="table modal-detail-table align-middle">
                        <thead>
                            <tr>
                                <th class="th-center" style="width: 20%;">Prazo</th>
                                <th class="th-val text-end" style="width: 40%;">Terceiros</th>
                                <th class="th-val text-end" style="width: 40%;">${labelRt}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderTabelaMesaSimples(linhasNormal, labelRt, emptyMsg)}
                        </tbody>
                    </table>
                </div>

                ${hasMeta ? `
                    <div class="mt-3">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-warning-subtle text-warning border border-warning px-2 py-1 small">
                                <i class="bi bi-bullseye me-1"></i>Limite Meta
                            </span>
                        </div>
                        <div class="table-responsive">
                            <table class="table modal-detail-table align-middle">
                                <thead>
                                    <tr>
                                        <th class="th-center" style="width: 20%;">Prazo</th>
                                        <th class="th-val text-end" style="width: 40%;">Terceiros Meta</th>
                                        <th class="th-val text-end" style="width: 40%;">${labelRt} Meta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${renderTabelaMesaSimples(linhasMeta, labelRt + ' Meta', emptyMsg)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // 4. MODAL DE DETALHES E DELIBERAÇÃO DA ALÇADA
    // -------------------------------------------------------------------------
    const modalEl = document.getElementById('modalDetalhesAlcada');
    const bsModal = modalEl ? new bootstrap.Modal(modalEl) : null;

    const modalIdDisplay = document.getElementById('modalIdAlcadaDisplay');
    const modalSubtituloDisplay = document.getElementById('modalAlcadaSubtituloDisplay');
    const modalLoader = document.getElementById('modalAlcadaLoader');
    const modalError = document.getElementById('modalAlcadaError');
    const modalErrorMessage = document.getElementById('modalAlcadaErrorMessage');
    const modalContent = document.getElementById('modalAlcadaContent');

    // Métricas de Resumo (Topo)
    const modalResumoGrupo = document.getElementById('modalAlcadaResumoGrupo');
    const modalResumoMesa = document.getElementById('modalAlcadaResumoMesa');
    const modalResumoEvento = document.getElementById('modalAlcadaResumoEvento');
    const modalResumoData = document.getElementById('modalAlcadaResumoData');
    const modalAlcadaCardRatingGrupo = document.getElementById('modalAlcadaCardRatingGrupo');
    const modalAlcadaResumoRatingContainer = document.getElementById('modalAlcadaResumoRatingContainer');
    const modalResumoRatingVigente = document.getElementById('modalAlcadaResumoRatingVigente');
    const modalResumoShare = document.getElementById('modalAlcadaResumoShare');

    // Containers das Abas
    const modalGrupoContainer = document.getElementById('modalAlcadaGrupoContainer');
    const modalQtdEmissores = document.getElementById('modalAlcadaQtdEmissores');
    const modalEmissoresContainer = document.getElementById('modalAlcadaEmissoresContainer');

    const modalGrupoVigenteContainer = document.getElementById('modalAlcadaGrupoVigenteContainer');
    const modalQtdEmissoresVigentes = document.getElementById('modalAlcadaQtdEmissoresVigentes');
    const modalEmissoresVigentesContainer = document.getElementById('modalAlcadaEmissoresVigentesContainer');

    // Form de Deliberação
    const formResponderAlcada = document.getElementById('formResponderAlcada');
    const inputAlcadaIdSolicitacao = document.getElementById('inputAlcadaIdSolicitacao');
    const btnConfirmarAlcada = document.getElementById('btnConfirmarAlcada');
    const alcadaSelectionAlert = document.getElementById('alcadaSelectionAlert');
    const radioAlcadas = document.querySelectorAll('input[name="dsAlcada"]');

    radioAlcadas.forEach(radio => {
        radio.addEventListener('change', function () {
            if (btnConfirmarAlcada) {
                btnConfirmarAlcada.disabled = false;
            }
            if (alcadaSelectionAlert) {
                alcadaSelectionAlert.classList.add('d-none');
            }
        });
    });

    const btnsAbrirDetalhes = document.querySelectorAll('.btn-abrir-detalhes-alcada');
    btnsAbrirDetalhes.forEach(btn => {
        btn.addEventListener('click', function () {
            const idSolicitacao = btn.dataset.id;
            const dsGrupo = btn.dataset.grupo || 'Grupo Econômico';
            const dsEvento = btn.dataset.evento || '';
            const dsMesa = btn.dataset.mesa || '';
            const dtSolicitacao = btn.dataset.data || '';

            if (modalIdDisplay) modalIdDisplay.textContent = `#${idSolicitacao}`;
            if (modalSubtituloDisplay) modalSubtituloDisplay.textContent = `${dsGrupo} • ${dsEvento}`;
            if (inputAlcadaIdSolicitacao) inputAlcadaIdSolicitacao.value = idSolicitacao;

            // Reseta opções de alçada
            radioAlcadas.forEach(r => r.checked = false);
            if (btnConfirmarAlcada) btnConfirmarAlcada.disabled = true;
            if (alcadaSelectionAlert) alcadaSelectionAlert.classList.add('d-none');

            // Ativa a primeira aba por padrão
            const firstTab = document.getElementById('tab-modal-solicitacao');
            if (firstTab && window.bootstrap) {
                const tabTrigger = new bootstrap.Tab(firstTab);
                tabTrigger.show();
            }

            // Exibe loader e abre modal
            if (modalLoader) modalLoader.classList.remove('d-none');
            if (modalError) modalError.classList.add('d-none');
            if (modalContent) modalContent.classList.add('d-none');

            if (bsModal) bsModal.show();

            // Busca os dados da alçada
            fetch(`/alcadas-pendentes/api/detalhes-solicitacao?idSolicitacao=${encodeURIComponent(idSolicitacao)}`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                    return res.json();
                })
                .then(resData => {
                    if (!resData.success || !resData.data) {
                        throw new Error(resData.message || 'Dados da solicitação não encontrados.');
                    }

                    const d = resData.data;

                    // 1. Identifica as mesas envolvidas na solicitação
                    const mesasSet = new Set();
                    (d.limitesGrupoPorMesaSemMeta || []).forEach(m => { if (m.cdMesa) mesasSet.add(m.cdMesa.trim().toUpperCase()); });
                    (d.limitesGrupoPorMesaComMeta || []).forEach(m => { if (m.cdMesa) mesasSet.add(m.cdMesa.trim().toUpperCase()); });
                    
                    if (mesasSet.size === 0 && d.cdMesa) {
                        d.cdMesa.split(',').forEach(m => { if (m.trim()) mesasSet.add(m.trim().toUpperCase()); });
                    }
                    const listaMesas = Array.from(mesasSet);
                    const temMultiplasMesas = listaMesas.length > 1;

                    // 2. Preenche Resumo Superior (Topo)
                    if (modalResumoGrupo) modalResumoGrupo.textContent = d.dsGrupo || dsGrupo;
                    if (modalResumoMesa) modalResumoMesa.textContent = d.cdMesa || dsMesa || 'Mesa não informada';
                    if (modalResumoEvento) modalResumoEvento.textContent = d.dsTipoEvento || dsEvento;
                    if (modalResumoData) modalResumoData.textContent = dtSolicitacao ? `Solicitado em ${dtSolicitacao}` : '-';
                    
                    // Rating do Grupo (fica vermelho e lista as mesas se houver divergência)
                    if (d.icDivergenciaRatingGrupo) {
                        if (modalAlcadaCardRatingGrupo) modalAlcadaCardRatingGrupo.classList.add('metric-card-danger');
                        if (modalAlcadaResumoRatingContainer) {
                            const listHtml = (d.ratingsGrupoPorMesa || []).map(rm => `
                                <div>${rm.cdMesa}: ${rm.cdRating || '-'}</div>
                            `).join('');
                            modalAlcadaResumoRatingContainer.innerHTML = `<div class="metric-rating-divergente-list">${listHtml}</div>`;
                        }
                    } else {
                        if (modalAlcadaCardRatingGrupo) modalAlcadaCardRatingGrupo.classList.remove('metric-card-danger');
                        if (modalAlcadaResumoRatingContainer) {
                            modalAlcadaResumoRatingContainer.innerHTML = `<span class="metric-value" id="modalAlcadaResumoRating">${d.cdRatingGrupo || '-'}</span>`;
                        }
                    }

                    const ratingVigenteGrupo = d.ratingsVigentes?.ratingGrupo?.cdRating || '-';
                    if (modalResumoRatingVigente) {
                        modalResumoRatingVigente.textContent = `Vigente: ${ratingVigenteGrupo}`;
                    }

                    // Share da Dívida (Soma consolidada das mesas)
                    let shareStr = '-';
                    if (d.vlShareDividaGrupo !== null && d.vlShareDividaGrupo !== undefined) {
                        const valShare = parseFloat(d.vlShareDividaGrupo);
                        shareStr = !isNaN(valShare) ? `${(valShare > 1 ? valShare : valShare * 100).toFixed(2)}%` : '-';
                    }
                    if (modalResumoShare) {
                        modalResumoShare.textContent = shareStr;
                    }

                    // =========================================================
                    // TAB 1: DADOS DA SOLICITAÇÃO
                    // =========================================================
                    let grupoHtml = '';

                    if (temMultiplasMesas) {
                        // Consolidado do Grupo somando as mesas
                        grupoHtml += renderBlocoConsolidadoComMeta(
                            'Consolidado do Grupo',
                            d.limitesGrupoConsolidadoSemMeta,
                            d.limitesGrupoConsolidadoComMeta,
                            'RT'
                        );

                        // Visão do Grupo por Mesa
                        grupoHtml += `
                            <div class="detail-section-card mb-4">
                                <h6 class="detail-section-title mb-3">
                                    <i class="bi bi-diagram-3 text-accent me-2"></i>Visão do Grupo por Mesa
                                </h6>
                        `;

                        listaMesas.forEach(mesaNome => {
                            const isPm = mesaNome.includes('PRIVATE MARKETS');
                            const labelColRt = isPm ? 'Multimesas' : 'RT';

                            const linhasMesaNormal = (d.limitesGrupoPorMesaSemMeta || []).filter(
                                x => (x.cdMesa || '').toUpperCase() === mesaNome
                            );
                            const linhasMesaMeta = (d.limitesGrupoPorMesaComMeta || []).filter(
                                x => (x.cdMesa || '').toUpperCase() === mesaNome
                            );

                            grupoHtml += renderBlocoMesaComMeta(mesaNome, linhasMesaNormal, linhasMesaMeta, labelColRt);
                        });

                        grupoHtml += `</div>`;
                    } else {
                        // Apenas 1 mesa: Mostra somente o quadro dessa mesa (sem consolidação somatória)
                        const mesaNome = listaMesas[0] || (d.cdMesa ? d.cdMesa.toUpperCase() : 'MESA');
                        const isPm = mesaNome.includes('PRIVATE MARKETS');
                        const labelColRt = isPm ? 'Multimesas' : 'RT';

                        const linhasMesaNormal = d.limitesGrupoPorMesaSemMeta || d.limitesGrupoConsolidadoSemMeta || [];
                        const linhasMesaMeta = d.limitesGrupoPorMesaComMeta || d.limitesGrupoConsolidadoComMeta || [];

                        grupoHtml += `
                            <div class="detail-section-card mb-4">
                                <h6 class="detail-section-title mb-3">
                                    <i class="bi bi-diagram-3 text-accent me-2"></i>Grupo Econômico
                                </h6>
                                ${renderBlocoMesaComMeta(mesaNome, linhasMesaNormal, linhasMesaMeta, labelColRt)}
                            </div>
                        `;
                    }

                    if (modalGrupoContainer) {
                        modalGrupoContainer.innerHTML = grupoHtml;
                    }

                    // Emissores do Grupo (Tab 1)
                    const emissores = Array.isArray(d.emissores) ? d.emissores : [];
                    if (modalQtdEmissores) modalQtdEmissores.textContent = emissores.length;

                    // Mapeia ratings vigentes dos emissores
                    const ratingsVigEmissoresMap = {};
                    if (Array.isArray(d.ratingsVigentes?.ratingsEmissores)) {
                        d.ratingsVigentes.ratingsEmissores.forEach(re => {
                            ratingsVigEmissoresMap[re.dsEmissor] = re.cdRating;
                        });
                    }

                    if (modalEmissoresContainer) {
                        if (emissores.length === 0) {
                            modalEmissoresContainer.innerHTML = '<div class="text-muted p-4 text-center">Nenhum emissor cadastrado para esta solicitação.</div>';
                        } else {
                            modalEmissoresContainer.innerHTML = emissores.map((e) => {
                                let shareEmissorStr = '-';
                                if (e.vlShareDividaEmissor !== null && e.vlShareDividaEmissor !== undefined) {
                                    const v = parseFloat(e.vlShareDividaEmissor);
                                    shareEmissorStr = !isNaN(v) ? `${(v > 1 ? v : v * 100).toFixed(2)}%` : '-';
                                }

                                const ratingVigEmissor = ratingsVigEmissoresMap[e.dsEmissor] ? `(Vigente: ${ratingsVigEmissoresMap[e.dsEmissor]})` : '';

                                let emissorTabelasHtml = '';

                                if (temMultiplasMesas) {
                                    // Consolidado do Emissor
                                    emissorTabelasHtml += renderBlocoConsolidadoComMeta(
                                        'Consolidado Emissor',
                                        e.limitesConsolidadoSemMeta,
                                        e.limitesConsolidadoComMeta,
                                        'RT'
                                    );

                                    // Sub-tabelas por mesa do emissor
                                    listaMesas.forEach(mesaNome => {
                                        const isPm = mesaNome.includes('PRIVATE MARKETS');
                                        const labelColRt = isPm ? 'Multimesas' : 'RT';

                                        const linhasEmMesaNorm = (e.limitesPorMesaSemMeta || []).filter(
                                            x => (x.cdMesa || '').toUpperCase() === mesaNome
                                        );
                                        const linhasEmMesaMeta = (e.limitesPorMesaComMeta || []).filter(
                                            x => (x.cdMesa || '').toUpperCase() === mesaNome
                                        );

                                        emissorTabelasHtml += renderBlocoMesaComMeta(mesaNome, linhasEmMesaNorm, linhasEmMesaMeta, labelColRt, 'Nenhum limite solicitado');
                                    });
                                } else {
                                    // Apenas 1 mesa para o emissor
                                    const mesaNome = listaMesas[0] || (d.cdMesa ? d.cdMesa.toUpperCase() : 'MESA');
                                    const isPm = mesaNome.includes('PRIVATE MARKETS');
                                    const labelColRt = isPm ? 'Multimesas' : 'RT';

                                    const linhasEmNorm = e.limitesPorMesaSemMeta || e.limitesConsolidadoSemMeta || [];
                                    const linhasEmMeta = e.limitesPorMesaComMeta || e.limitesConsolidadoComMeta || [];

                                    emissorTabelasHtml += renderBlocoMesaComMeta(mesaNome, linhasEmNorm, linhasEmMeta, labelColRt, 'Nenhum limite solicitado');
                                }

                                let ratingHeaderHtml = '';
                                if (e.icDivergenciaRating) {
                                    const listHtml = (e.ratingsPorMesa || []).map(rm => `
                                        <div>${rm.cdMesa}: ${rm.cdRating || '-'}</div>
                                    `).join('');

                                    ratingHeaderHtml = `
                                        <div class="emissor-header-meta flex-wrap">
                                            <div class="emissor-rating-divergente-box">
                                                ${listHtml}
                                            </div>
                                            ${ratingVigEmissor ? `<span class="emissor-meta-sub">${ratingVigEmissor}</span>` : ''}
                                            <span class="text-muted opacity-50">|</span>
                                            <div class="d-inline-flex align-items-center">
                                                <span class="emissor-meta-label">Share da Dívida:</span>
                                                <span class="emissor-meta-value">${shareEmissorStr}</span>
                                            </div>
                                        </div>
                                    `;
                                } else {
                                    ratingHeaderHtml = `
                                        <div class="emissor-header-meta flex-wrap">
                                            <div class="d-inline-flex align-items-center">
                                                <span class="emissor-meta-label">Rating:</span>
                                                <span class="emissor-meta-value">${e.cdRatingEmissor || '-'}</span>
                                                ${ratingVigEmissor ? `<span class="emissor-meta-sub">${ratingVigEmissor}</span>` : ''}
                                            </div>
                                            <span class="text-muted opacity-50">|</span>
                                            <div class="d-inline-flex align-items-center">
                                                <span class="emissor-meta-label">Share da Dívida:</span>
                                                <span class="emissor-meta-value">${shareEmissorStr}</span>
                                            </div>
                                        </div>
                                    `;
                                }

                                return `
                                    <div class="modal-emissor-card">
                                        <div class="modal-emissor-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                                            <div class="d-flex align-items-center gap-2">
                                                <i class="bi bi-building text-accent"></i>
                                                <h6 class="modal-emissor-title mb-0">${e.dsEmissor || 'Emissor'}</h6>
                                            </div>
                                            ${ratingHeaderHtml}
                                        </div>

                                        ${emissorTabelasHtml}
                                    </div>
                                `;
                            }).join('');
                        }
                    }

                    // =========================================================
                    // TAB 2: LIMITES VIGENTES
                    // =========================================================
                    const vig = d.limitesVigentes || {};
                    let grupoVigHtml = '';

                    const mesasVigSet = new Set();
                    (vig.limitesGrupoPorMesaSemMeta || []).forEach(m => { if (m.cdMesa) mesasVigSet.add(m.cdMesa.trim().toUpperCase()); });
                    const listaMesasVig = Array.from(mesasVigSet);
                    const temMultiplasMesasVig = listaMesasVig.length > 1;

                    if (temMultiplasMesasVig) {
                        grupoVigHtml += `
                            <div class="detail-section-card mb-4">
                                <h6 class="detail-section-title mb-3">
                                    <i class="bi bi-shield-check text-accent me-2"></i>Consolidado do Grupo Vigente
                                </h6>
                                <div class="table-responsive">
                                    <table class="table modal-detail-table align-middle">
                                        <thead>
                                            <tr>
                                                <th class="th-center" style="width: 15%;">Prazo</th>
                                                <th class="th-val text-end" style="width: 25%;">Total Vigente</th>
                                                <th class="th-val text-end" style="width: 30%;">Terceiros Vigente</th>
                                                <th class="th-val text-end" style="width: 30%;">RT / Multimesas Vigente</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${renderTabelaConsolidadaSimples(vig.limitesGrupoConsolidadoSemMeta, 'RT / Multimesas Vigente')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="detail-section-card mb-4">
                                <h6 class="detail-section-title mb-3">
                                    <i class="bi bi-diagram-3 text-accent me-2"></i>Visão do Grupo por Mesa Vigente
                                </h6>
                        `;

                        listaMesasVig.forEach(mesaNome => {
                            const isPm = mesaNome.includes('PRIVATE MARKETS');
                            const labelColRt = isPm ? 'Multimesas' : 'RT';
                            const linhasMesa = (vig.limitesGrupoPorMesaSemMeta || []).filter(
                                x => (x.cdMesa || '').toUpperCase() === mesaNome
                            );

                            grupoVigHtml += `
                                <div class="mesa-subcard mb-3">
                                    <div class="mesa-subcard-header">
                                        <h6 class="mesa-subcard-title"><i class="bi bi-layers text-accent"></i> ${mesaNome}</h6>
                                    </div>
                                    <div class="table-responsive">
                                        <table class="table modal-detail-table align-middle">
                                            <thead>
                                                <tr>
                                                    <th class="th-center" style="width: 20%;">Prazo</th>
                                                    <th class="th-val text-end" style="width: 40%;">Terceiros Vigente</th>
                                                    <th class="th-val text-end" style="width: 40%;">${labelColRt} Vigente</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${renderTabelaMesaSimples(linhasMesa, labelColRt)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            `;
                        });

                        grupoVigHtml += `</div>`;
                    } else {
                        const mesaNome = listaMesasVig[0] || (d.cdMesa ? d.cdMesa.toUpperCase() : 'MESA');
                        const isPm = mesaNome.includes('PRIVATE MARKETS');
                        const labelColRt = isPm ? 'Multimesas' : 'RT';
                        const linhasMesa = vig.limitesGrupoPorMesaSemMeta || vig.limitesGrupoConsolidadoSemMeta || [];

                        grupoVigHtml += `
                            <div class="detail-section-card mb-4">
                                <h6 class="detail-section-title mb-3">
                                    <i class="bi bi-shield-check text-accent me-2"></i>Grupo Econômico (Vigente)
                                </h6>
                                <div class="table-responsive">
                                    <table class="table modal-detail-table align-middle">
                                        <thead>
                                            <tr>
                                                <th class="th-center" style="width: 20%;">Prazo</th>
                                                <th class="th-val text-end" style="width: 40%;">Terceiros Vigente</th>
                                                <th class="th-val text-end" style="width: 40%;">${labelColRt} Vigente</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${renderTabelaMesaSimples(linhasMesa, labelColRt)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `;
                    }

                    if (modalGrupoVigenteContainer) {
                        modalGrupoVigenteContainer.innerHTML = grupoVigHtml;
                    }

                    // Emissores Vigentes (Tab 2)
                    const emissoresVig = Array.isArray(vig.emissores) ? vig.emissores : [];
                    if (modalQtdEmissoresVigentes) modalQtdEmissoresVigentes.textContent = emissoresVig.length;

                    if (modalEmissoresVigentesContainer) {
                        if (emissoresVig.length === 0) {
                            modalEmissoresVigentesContainer.innerHTML = '<div class="text-muted p-4 text-center">Nenhum limite vigente cadastrado para os emissores.</div>';
                        } else {
                            modalEmissoresVigentesContainer.innerHTML = emissoresVig.map((ve) => {
                                const ratingVig = ratingsVigEmissoresMap[ve.dsEmissor] ? ratingsVigEmissoresMap[ve.dsEmissor] : '-';

                                let emissorVigTabelasHtml = '';
                                if (temMultiplasMesasVig) {
                                    emissorVigTabelasHtml += `
                                        <div class="mesa-subcard mb-3">
                                            <div class="mesa-subcard-header">
                                                <h6 class="mesa-subcard-title"><i class="bi bi-layers-half text-accent"></i> Consolidado Vigente</h6>
                                            </div>
                                            <div class="table-responsive">
                                                <table class="table modal-detail-table align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th class="th-center" style="width: 15%;">Prazo</th>
                                                            <th class="th-val text-end" style="width: 25%;">Total Vigente</th>
                                                            <th class="th-val text-end" style="width: 30%;">Terceiros Vigente</th>
                                                            <th class="th-val text-end" style="width: 30%;">RT / Multimesas Vigente</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${renderTabelaConsolidadaSimples(ve.limitesConsolidadoSemMeta, 'RT / Multimesas')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    `;

                                    listaMesasVig.forEach(mesaNome => {
                                        const isPm = mesaNome.includes('PRIVATE MARKETS');
                                        const labelColRt = isPm ? 'Multimesas' : 'RT';
                                        const linhasMesa = (ve.limitesPorMesaSemMeta || []).filter(
                                            x => (x.cdMesa || '').toUpperCase() === mesaNome
                                        );

                                        emissorVigTabelasHtml += `
                                            <div class="mesa-subcard mb-3">
                                                <div class="mesa-subcard-header">
                                                    <h6 class="mesa-subcard-title"><i class="bi bi-layers text-accent"></i> ${mesaNome}</h6>
                                                </div>
                                                <div class="table-responsive">
                                                    <table class="table modal-detail-table align-middle">
                                                        <thead>
                                                            <tr>
                                                                <th class="th-center" style="width: 20%;">Prazo</th>
                                                                <th class="th-val text-end" style="width: 40%;">Terceiros Vigente</th>
                                                                <th class="th-val text-end" style="width: 40%;">${labelColRt} Vigente</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${renderTabelaMesaSimples(linhasMesa, labelColRt)}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        `;
                                    });
                                } else {
                                    const mesaNome = listaMesasVig[0] || (d.cdMesa ? d.cdMesa.toUpperCase() : 'MESA');
                                    const isPm = mesaNome.includes('PRIVATE MARKETS');
                                    const labelColRt = isPm ? 'Multimesas' : 'RT';
                                    const linhasMesa = ve.limitesPorMesaSemMeta || ve.limitesConsolidadoSemMeta || [];

                                    emissorVigTabelasHtml += `
                                        <div class="table-responsive">
                                            <table class="table modal-detail-table align-middle">
                                                <thead>
                                                    <tr>
                                                        <th class="th-center" style="width: 20%;">Prazo</th>
                                                        <th class="th-val text-end" style="width: 40%;">Terceiros Vigente</th>
                                                        <th class="th-val text-end" style="width: 40%;">${labelColRt} Vigente</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${renderTabelaMesaSimples(linhasMesa, labelColRt)}
                                                </tbody>
                                            </table>
                                        </div>
                                    `;
                                }

                                return `
                                    <div class="modal-emissor-card">
                                        <div class="modal-emissor-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                                            <div class="d-flex align-items-center gap-2">
                                                <i class="bi bi-building text-accent"></i>
                                                <h6 class="modal-emissor-title mb-0">${ve.dsEmissor || 'Emissor'}</h6>
                                            </div>
                                            <div class="emissor-header-meta">
                                                <div class="d-inline-flex align-items-center">
                                                    <span class="emissor-meta-label">Rating Vigente:</span>
                                                    <span class="emissor-meta-value">${ratingVig}</span>
                                                </div>
                                            </div>
                                        </div>

                                        ${emissorVigTabelasHtml}
                                    </div>
                                `;
                            }).join('');
                        }
                    }

                    // Exibe o conteúdo e oculta loader
                    if (modalLoader) modalLoader.classList.add('d-none');
                    if (modalContent) modalContent.classList.remove('d-none');
                })
                .catch(err => {
                    console.error("Erro ao carregar detalhes da alçada:", err);
                    if (modalLoader) modalLoader.classList.add('d-none');
                    if (modalErrorMessage) modalErrorMessage.textContent = err.message || 'Erro ao carregar detalhes da solicitação de alçada.';
                    if (modalError) modalError.classList.remove('d-none');
                });
        });
    });

    // -------------------------------------------------------------------------
    // 5. SUBMISSÃO DA DELIBERAÇÃO DE ALÇADA
    // -------------------------------------------------------------------------
    if (formResponderAlcada) {
        formResponderAlcada.addEventListener('submit', function (e) {
            e.preventDefault();

            const checkedAlcada = document.querySelector('input[name="dsAlcada"]:checked');
            if (!checkedAlcada) {
                if (alcadaSelectionAlert) alcadaSelectionAlert.classList.remove('d-none');
                return;
            }

            const dsAlcada = checkedAlcada.value;
            const idSolicitacao = inputAlcadaIdSolicitacao ? inputAlcadaIdSolicitacao.value : null;

            if (!idSolicitacao) {
                alert('Identificador da solicitação não encontrado.');
                return;
            }

            if (btnConfirmarAlcada) {
                btnConfirmarAlcada.disabled = true;
                btnConfirmarAlcada.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Registrando alçada...';
            }

            fetch('/alcadas-pendentes/responder-alcada', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    idSolicitacao: idSolicitacao,
                    dsAlcada: dsAlcada
                })
            })
                .then(res => res.json())
                .then(resData => {
                    if (resData.success) {
                        if (bsModal) bsModal.hide();
                        window.location.reload();
                    } else {
                        throw new Error(resData.message || 'Erro ao registrar deliberação de alçada.');
                    }
                })
                .catch(err => {
                    alert(`Erro ao registrar deliberação da alçada: ${err.message}`);
                    if (btnConfirmarAlcada) {
                        btnConfirmarAlcada.disabled = false;
                        btnConfirmarAlcada.innerHTML = '<i class="bi bi-send-check-fill me-1"></i> Confirmar e Enviar Alçada';
                    }
                });
        });
    }
});



