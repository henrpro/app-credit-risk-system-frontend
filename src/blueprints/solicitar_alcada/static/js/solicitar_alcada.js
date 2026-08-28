document.addEventListener('DOMContentLoaded', function () {
    // -------------------------------------------------------------------------
    // 1. CARREGAMENTO DE DADOS INICIAIS (JSON EMBEDDED)
    // -------------------------------------------------------------------------
    const ratingsListEl = document.getElementById('ratingsDataJson');
    let ratingsOptions = [];
    if (ratingsListEl) {
        try {
            ratingsOptions = JSON.parse(ratingsListEl.textContent || '[]');
        } catch (e) {
            ratingsOptions = [];
        }
    }

    const flexListEl = document.getElementById('flexibilizacaoDataJson');
    let flexData = [];
    if (flexListEl) {
        try {
            flexData = JSON.parse(flexListEl.textContent || '[]');
        } catch (e) {
            flexData = [];
        }
    }

    // Mapa de flexibilização disponível por chave: [idEmissor_prazo] e [dsEmissor_prazo]
    const flexDisponivelMap = {};
    if (Array.isArray(flexData)) {
        flexData.forEach(item => {
            const idEm = item.idEmissor;
            const dsEm = (item.dsEmissor || '').trim().toLowerCase();
            const prazo = parseFloat(item.vlPrazo);
            const disp = parseFloat(item.vlDisponivelFlex || 0);

            if (idEm !== undefined && idEm !== null && !isNaN(prazo)) {
                flexDisponivelMap[`${idEm}_${prazo}`] = disp;
            }
            if (dsEm && !isNaN(prazo)) {
                flexDisponivelMap[`${dsEm}_${prazo}`] = disp;
            }
        });
    }

    // -------------------------------------------------------------------------
    // 2. IDENTIFICAÇÃO DO FORMULÁRIO E TEMPLATE ATIVO
    // -------------------------------------------------------------------------
    const formSalvar = document.getElementById('formSalvarSolicitacaoAlcada');
    const templateTipo = formSalvar ? (formSalvar.dataset.templateTipo || 'limite_padrao') : '';
    const tipoEvento = formSalvar ? (formSalvar.dataset.tipoEvento || '') : '';

    const isAbertura = (templateTipo === 'abertura');
    const isFlexibilizacao = (templateTipo === 'flexibilizacao');
    const isFlexSemLmax = (templateTipo === 'flex_sem_lmax');
    const isProrrogacao = (templateTipo === 'prorrogacao');
    const isRatingOnly = (templateTipo === 'rating');
    const isRatingRunoff = (templateTipo === 'rating_runoff');

    const canAddRemoveRows = (isAbertura || templateTipo === 'limite_padrao');

    // -------------------------------------------------------------------------
    // 3. UTILITÁRIOS DE FORMATAÇÃO E PARSE
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
        if (isNaN(num)) num = 0;
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatCurrency(num) {
        return `R$ ${formatNumber(num)}`;
    }

    // -------------------------------------------------------------------------
    // 4. LÓGICA DA TELA INICIAL (BUSCA DINÂMICA DE EVENTOS POR GRUPO)
    // -------------------------------------------------------------------------
    const selectGrupoInit = document.getElementById('selectGrupoEconomico');
    const selectEventoInit = document.getElementById('selectTipoEvento');

    if (selectGrupoInit && selectEventoInit && !formSalvar) {
        selectGrupoInit.addEventListener('change', function () {
            const dsGrupo = selectGrupoInit.value;
            if (!dsGrupo) return;

            const apiUrl = selectGrupoInit.dataset.apiUrl || '/solicitar-alcada/api/obtem-tipos-eventos';

            selectEventoInit.disabled = true;
            selectEventoInit.innerHTML = '<option value="" disabled selected>Carregando eventos disponíveis...</option>';

            fetch(`${apiUrl}?dsGrupo=${encodeURIComponent(dsGrupo)}`)
                .then(res => res.json())
                .then(data => {
                    selectEventoInit.innerHTML = '<option value="" disabled selected>Selecione um evento...</option>';
                    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                        data.data.forEach(ev => {
                            const nome = ev.dsTipoEvento || ev.dsEvento || ev.nome || ev;
                            const opt = document.createElement('option');
                            opt.value = nome;
                            opt.textContent = nome;
                            selectEventoInit.appendChild(opt);
                        });
                        selectEventoInit.disabled = false;
                        selectEventoInit.focus();
                    } else {
                        selectEventoInit.innerHTML = '<option value="" disabled selected>Nenhum evento disponível para o grupo selecionado.</option>';
                    }
                })
                .catch(err => {
                    console.error("Erro ao carregar eventos:", err);
                    selectEventoInit.innerHTML = '<option value="" disabled selected>Erro ao carregar eventos do grupo.</option>';
                });
        });
    }

    // Se não estivermos em um formulário de solicitação de evento, encerra a execução
    if (!formSalvar) return;

    // -------------------------------------------------------------------------
    // 5. CÁLCULO DAS LINHAS DE CADA EMISSOR
    // -------------------------------------------------------------------------
    function updateEmissorRow(row) {
        const inputPrazo = row.querySelector('.input-prazo');
        const inputTercProp = row.querySelector('.input-terceiros-proposto');
        const inputRtProp = row.querySelector('.input-rt-proposto');
        const inputTercAtual = row.querySelector('.input-terceiros-atual');
        const inputRtAtual = row.querySelector('.input-rt-atual');

        const spanTotalProp = row.querySelector('.total-proposto-calc');
        const hiddenTotalProp = row.querySelector('.input-hidden-total-proposto');
        const spanTotalAtual = row.querySelector('.total-atual-calc');
        const hiddenTotalAtual = row.querySelector('.input-hidden-total-atual');

        const valTercProp = inputTercProp ? parseVal(inputTercProp.value) : 0;
        const valRtProp = inputRtProp ? parseVal(inputRtProp.value) : 0;
        const totalProp = valTercProp + valRtProp;

        if (spanTotalProp) spanTotalProp.textContent = formatNumber(totalProp);
        if (hiddenTotalProp) hiddenTotalProp.value = totalProp;

        let totalAtual = 0;
        if (inputTercAtual && inputRtAtual) {
            const valTercAtual = parseVal(inputTercAtual.value);
            const valRtAtual = parseVal(inputRtAtual.value);
            totalAtual = valTercAtual + valRtAtual;

            if (spanTotalAtual) spanTotalAtual.textContent = formatNumber(totalAtual);
            if (hiddenTotalAtual) hiddenTotalAtual.value = totalAtual;
        }

        // Validação de teto para template de Flexibilização
        if (isFlexibilizacao) {
            const card = row.closest('.emissor-card');
            const idEmissor = card ? card.dataset.emissorId : '';
            const dsEmissor = card ? (card.dataset.emissorNome || '').toLowerCase().trim() : '';
            const prazo = inputPrazo ? parseVal(inputPrazo.value) : 0;

            const dispKeyId = `${idEmissor}_${prazo}`;
            const dispKeyNome = `${dsEmissor}_${prazo}`;
            const valDisp = flexDisponivelMap[dispKeyId] !== undefined ? flexDisponivelMap[dispKeyId] : (flexDisponivelMap[dispKeyNome] || 0);

            const tetoFlex = totalAtual + valDisp;
            const spanTeto = row.querySelector('.cell-teto-flex');
            const hiddenTeto = row.querySelector('.input-hidden-teto-flex');
            const feedbackEl = row.querySelector('.flex-feedback');

            if (spanTeto) spanTeto.textContent = formatCurrency(tetoFlex);
            if (hiddenTeto) hiddenTeto.value = tetoFlex;

            if (feedbackEl) {
                if (totalProp > (tetoFlex + 0.01)) {
                    feedbackEl.textContent = `Excede teto máximo permitido (${formatCurrency(tetoFlex)})`;
                    feedbackEl.classList.remove('d-none');
                    if (inputTercProp) inputTercProp.classList.add('is-invalid');
                    if (inputRtProp) inputRtProp.classList.add('is-invalid');
                } else {
                    feedbackEl.classList.add('d-none');
                    feedbackEl.textContent = '';
                    if (inputTercProp) inputTercProp.classList.remove('is-invalid');
                    if (inputRtProp) inputRtProp.classList.remove('is-invalid');
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // 6. CÁLCULO DA TABELA CONSOLIDADA DO GRUPO ECONÔMICO (PIRAMIDAL + META)
    // -------------------------------------------------------------------------
    function getEmissorLines(card) {
        const lines = [];
        const rows = card.querySelectorAll('.emissor-table-row');
        rows.forEach(row => {
            const inputPrazo = row.querySelector('.input-prazo');
            const prazoVal = inputPrazo ? inputPrazo.value.trim() : '';
            if (!prazoVal) return;

            const prazo = parseInt(prazoVal, 10);
            if (isNaN(prazo) || prazo <= 0) return;

            const inputTercProp = row.querySelector('.input-terceiros-proposto');
            const inputRtProp = row.querySelector('.input-rt-proposto');
            const inputTercAtual = row.querySelector('.input-terceiros-atual');
            const inputRtAtual = row.querySelector('.input-rt-atual');

            const valTercProp = inputTercProp ? parseVal(inputTercProp.value) : 0;
            const valRtProp = inputRtProp ? parseVal(inputRtProp.value) : 0;
            const valTercAtual = inputTercAtual ? parseVal(inputTercAtual.value) : 0;
            const valRtAtual = inputRtAtual ? parseVal(inputRtAtual.value) : 0;

            lines.push({
                prazo: prazo,
                terceirosProposto: valTercProp,
                rtProposto: valRtProp,
                totalProposto: valTercProp + valRtProp,
                terceirosAtual: valTercAtual,
                rtAtual: valRtAtual,
                totalAtual: valTercAtual + valRtAtual
            });
        });
        return lines;
    }

    function getEmissorMetaLines(card) {
        if (card.metaData && Array.isArray(card.metaData.rows) && card.metaData.rows.length > 0) {
            return card.metaData.rows.map(r => ({
                prazo: parseInt(r.prazo, 10),
                terceirosProposto: parseVal(r.terceiros),
                rtProposto: parseVal(r.rt)
            })).filter(r => !isNaN(r.prazo) && r.prazo > 0);
        }

        // Fallback lendo inputs hidden já renderizados no DOM do card
        const hiddenRows = [];
        const emissorIdx = card.dataset.emissorIndex;
        let rIdx = 0;
        while (card.querySelector(`input[name="emissores[${emissorIdx}][meta][rows][${rIdx}][prazo]"]`)) {
            const pVal = card.querySelector(`input[name="emissores[${emissorIdx}][meta][rows][${rIdx}][prazo]"]`)?.value;
            const tVal = card.querySelector(`input[name="emissores[${emissorIdx}][meta][rows][${rIdx}][terceiros]"]`)?.value;
            const rtVal = card.querySelector(`input[name="emissores[${emissorIdx}][meta][rows][${rIdx}][rt]"]`)?.value;
            const prazo = parseInt(pVal, 10);
            if (!isNaN(prazo) && prazo > 0) {
                hiddenRows.push({
                    prazo: prazo,
                    terceirosProposto: parseVal(tVal),
                    rtProposto: parseVal(rtVal)
                });
            }
            rIdx++;
        }
        return hiddenRows;
    }

    function resolvePiramidalValue(lines, targetPrazo, field) {
        if (!Array.isArray(lines) || lines.length === 0) return 0;

        // 1. Procura valor exato no targetPrazo
        const exact = lines.find(l => l.prazo === targetPrazo);
        if (exact && exact[field] !== undefined) {
            return exact[field];
        }

        // 2. Cascata piramidal: menor prazo existente que é maior que targetPrazo
        const longerLines = lines
            .filter(l => l.prazo > targetPrazo && l[field] !== undefined)
            .sort((a, b) => a.prazo - b.prazo);

        if (longerLines.length > 0) {
            return longerLines[0][field];
        }

        return 0;
    }

    function updateConsolidadoGrupo() {
        const tabelaGrupoBody = document.querySelector('#tabelaGrupoConsolidada tbody');
        if (!tabelaGrupoBody) return;

        const emissorCards = formSalvar.querySelectorAll('.emissor-card');
        const allPrazosSet = new Set();
        const emissoresData = [];

        // 1. Coleta dados de todos os emissores e reúne todos os prazos distintos
        emissorCards.forEach(card => {
            const normalLines = getEmissorLines(card);
            const metaLines = getEmissorMetaLines(card);

            normalLines.forEach(l => allPrazosSet.add(l.prazo));
            metaLines.forEach(l => allPrazosSet.add(l.prazo));

            emissoresData.push({
                card: card,
                normalLines: normalLines,
                metaLines: metaLines
            });
        });

        // 2. Ordena os prazos de forma crescente
        const prazosOrdenados = Array.from(allPrazosSet).sort((a, b) => a - b);

        tabelaGrupoBody.innerHTML = '';

        if (prazosOrdenados.length === 0) {
            const colspan = isAbertura ? 4 : (isFlexSemLmax ? 8 : 7);
            tabelaGrupoBody.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-muted py-3">Nenhum prazo preenchido nos emissores.</td></tr>`;
            return;
        }

        // 3. Para cada prazo consolidado, calcula os valores aplicando regra piramidal e max(normal, meta)
        const consolidadoPorPrazo = {};

        prazosOrdenados.forEach(prazo => {
            consolidadoPorPrazo[prazo] = {
                prazo: prazo,
                totalAtual: 0,
                totalProposto: 0,
                terceirosAtual: 0,
                terceirosProposto: 0,
                rtAtual: 0,
                rtProposto: 0
            };

            emissoresData.forEach(e => {
                // Cascata piramidal nas linhas normais
                const normalTercProp = resolvePiramidalValue(e.normalLines, prazo, 'terceirosProposto');
                const normalRtProp = resolvePiramidalValue(e.normalLines, prazo, 'rtProposto');
                const normalTercAtual = resolvePiramidalValue(e.normalLines, prazo, 'terceirosAtual');
                const normalRtAtual = resolvePiramidalValue(e.normalLines, prazo, 'rtAtual');

                let effTercProp = normalTercProp;
                let effRtProp = normalRtProp;

                // Se houver limite meta, aplica cascata piramidal no meta e seleciona o maior valor
                if (e.metaLines.length > 0) {
                    const metaTercProp = resolvePiramidalValue(e.metaLines, prazo, 'terceirosProposto');
                    const metaRtProp = resolvePiramidalValue(e.metaLines, prazo, 'rtProposto');

                    effTercProp = Math.max(normalTercProp, metaTercProp);
                    effRtProp = Math.max(normalRtProp, metaRtProp);
                }

                const effTotalProp = effTercProp + effRtProp;
                const effTotalAtual = normalTercAtual + normalRtAtual;

                consolidadoPorPrazo[prazo].terceirosProposto += effTercProp;
                consolidadoPorPrazo[prazo].rtProposto += effRtProp;
                consolidadoPorPrazo[prazo].totalProposto += effTotalProp;

                consolidadoPorPrazo[prazo].terceirosAtual += normalTercAtual;
                consolidadoPorPrazo[prazo].rtAtual += normalRtAtual;
                consolidadoPorPrazo[prazo].totalAtual += effTotalAtual;
            });
        });

        let lmaxDesbalanceadoCount = 0;
        let lmaxDetalhesDeltas = [];

        prazosOrdenados.forEach(prazo => {
            const data = consolidadoPorPrazo[prazo];
            const tr = document.createElement('tr');

            if (isAbertura) {
                // Apenas colunas propostas
                tr.innerHTML = `
                    <td class="text-center fw-bold">${data.prazo}</td>
                    <td class="text-end fw-bold cell-val-proposto">${formatNumber(data.totalProposto)}</td>
                    <td class="text-end cell-val-proposto">${formatNumber(data.terceirosProposto)}</td>
                    <td class="text-end cell-val-proposto">${formatNumber(data.rtProposto)}</td>
                `;
            } else if (isFlexSemLmax) {
                // Template com Delta de LMAX
                const delta = data.totalProposto - data.totalAtual;
                const isEquilibrado = Math.abs(delta) < 0.01;

                if (!isEquilibrado) {
                    lmaxDesbalanceadoCount++;
                    lmaxDetalhesDeltas.push(`Prazo ${prazo}: ${delta > 0 ? '+' : ''}${formatCurrency(delta)}`);
                }

                const deltaBadge = isEquilibrado
                    ? `<span class="badge bg-success-subtle text-success border border-success px-2 py-1"><i class="bi bi-check me-1"></i>0,00</span>`
                    : `<span class="badge bg-danger-subtle text-danger border border-danger px-2 py-1"><i class="bi bi-exclamation-triangle me-1"></i>${delta > 0 ? '+' : ''}${formatNumber(delta)}</span>`;

                tr.innerHTML = `
                    <td class="text-center fw-bold">${data.prazo}</td>
                    <td class="text-end cell-val-atual">${formatNumber(data.totalAtual)}</td>
                    <td class="text-end fw-bold cell-val-proposto">${formatNumber(data.totalProposto)}</td>
                    <td class="text-center">${deltaBadge}</td>
                    <td class="text-end cell-val-atual">${formatNumber(data.terceirosAtual)}</td>
                    <td class="text-end cell-val-proposto">${formatNumber(data.terceirosProposto)}</td>
                    <td class="text-end cell-val-atual">${formatNumber(data.rtAtual)}</td>
                    <td class="text-end cell-val-proposto">${formatNumber(data.rtProposto)}</td>
                `;
            } else {
                // Modo Padrão / Flex / Rating / Prorrogação
                tr.innerHTML = `
                    <td class="text-center fw-bold">${data.prazo}</td>
                    <td class="text-end cell-val-atual">${formatNumber(data.totalAtual)}</td>
                    <td class="text-end fw-bold cell-val-proposto">${formatNumber(data.totalProposto)}</td>
                    <td class="text-end cell-val-atual">${formatNumber(data.terceirosAtual)}</td>
                    <td class="text-end cell-val-proposto">${formatNumber(data.terceirosProposto)}</td>
                    <td class="text-end cell-val-atual">${formatNumber(data.rtAtual)}</td>
                    <td class="text-end cell-val-proposto">${formatNumber(data.rtProposto)}</td>
                `;
            }

            tabelaGrupoBody.appendChild(tr);
        });

        // Atualiza painel de equilíbrio LMAX para Template 7
        if (isFlexSemLmax) {
            const painelLmax = document.getElementById('painelEquilibrioLMAX');
            const textoStatus = document.getElementById('textoStatusLMAX');
            const iconeStatus = document.getElementById('iconeStatusLMAX');
            const badgeDetalhe = document.getElementById('badgeDetalheLMAX');

            if (painelLmax && textoStatus && badgeDetalhe) {
                if (lmaxDesbalanceadoCount === 0) {
                    iconeStatus.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>';
                    textoStatus.innerHTML = 'Balanço de LMAX por Prazo: <span class="text-success">Equilibrado (Delta R$ 0,00)</span>';
                    badgeDetalhe.className = 'badge bg-success-subtle text-success border border-success px-3 py-2';
                    badgeDetalhe.textContent = 'LMAX Preservado em todos os prazos';
                } else {
                    iconeStatus.innerHTML = '<i class="bi bi-exclamation-octagon-fill text-danger"></i>';
                    textoStatus.innerHTML = `Balanço de LMAX por Prazo: <span class="text-danger">Desbalanceado (${lmaxDesbalanceadoCount} prazo(s))</span>`;
                    badgeDetalhe.className = 'badge bg-danger-subtle text-danger border border-danger px-3 py-2';
                    badgeDetalhe.textContent = lmaxDetalhesDeltas.join(' | ');
                }
            }
        }
    }

    function updateEmissoresRatingRequirement() {
        if (isRatingOnly || isRatingRunoff) return;

        const cards = formSalvar.querySelectorAll('.emissor-card');
        cards.forEach(card => {
            const rows = card.querySelectorAll('.emissor-table-row');
            const hasMeta = card.metaData && Array.isArray(card.metaData.rows) && card.metaData.rows.length > 0;
            const temLinhasOuMeta = rows.length > 0 || hasMeta;

            const selectRating = card.querySelector('.select-rating-proposto-emissor');
            const starRating = card.querySelector('.rating-required-star');

            if (selectRating) {
                if (temLinhasOuMeta) {
                    selectRating.required = true;
                    if (starRating) starRating.classList.remove('d-none');
                } else {
                    selectRating.required = false;
                    selectRating.classList.remove('is-invalid');
                    if (starRating) starRating.classList.add('d-none');
                }
            }
        });
    }

    function recalculateAll() {
        const rows = formSalvar.querySelectorAll('.emissor-table-row');
        rows.forEach(row => updateEmissorRow(row));
        updateConsolidadoGrupo();
        updateEmissoresRatingRequirement();
    }

    // -------------------------------------------------------------------------
    // 7. CRIAÇÃO DINÂMICA DE LINHAS DE EMISSOR
    // -------------------------------------------------------------------------
    function createEmissorTableRow(emissorIdx, rowData = {}) {
        const tr = document.createElement('tr');
        tr.className = 'emissor-table-row';

        const prazoVal = rowData.prazo !== undefined && rowData.prazo !== null ? rowData.prazo : '';
        const tercPropVal = rowData.terceirosProposto !== undefined && rowData.terceirosProposto !== null ? rowData.terceirosProposto : '';
        const rtPropVal = rowData.rtProposto !== undefined && rowData.rtProposto !== null ? rowData.rtProposto : '';

        if (isAbertura) {
            tr.innerHTML = `
                <td class="text-center">
                    <input type="number" step="1" min="1" class="table-input input-prazo" name="emissores[${emissorIdx}][prazos][]" value="${prazoVal}" placeholder="Prazo" required>
                    <div class="row-validation-feedback cascade-feedback d-none"></div>
                </td>
                <td>
                    <span class="cell-total-calc total-proposto total-proposto-calc cell-val-proposto">0,00</span>
                    <input type="hidden" class="input-hidden-total-proposto" name="emissores[${emissorIdx}][totais_proposto][]" value="0">
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-terceiros-proposto cell-val-proposto" name="emissores[${emissorIdx}][terceiros_proposto][]" value="${tercPropVal}" placeholder="0,00" required>
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-rt-proposto cell-val-proposto" name="emissores[${emissorIdx}][rts_proposto][]" value="${rtPropVal}" placeholder="0,00" required>
                </td>
                <td class="text-center">
                    <button type="button" class="btn-remove-row" title="Remover Linha"><i class="bi bi-trash"></i></button>
                </td>
            `;
        } else {
            const tercAtualVal = rowData.terceirosAtual !== undefined && rowData.terceirosAtual !== null ? rowData.terceirosAtual : '';
            const rtAtualVal = rowData.rtAtual !== undefined && rowData.rtAtual !== null ? rowData.rtAtual : '';

            tr.innerHTML = `
                <td class="text-center">
                    <input type="number" step="1" min="1" class="table-input input-prazo" name="emissores[${emissorIdx}][prazos][]" value="${prazoVal}" placeholder="Prazo" required>
                    <div class="row-validation-feedback cascade-feedback d-none"></div>
                </td>
                <td>
                    <span class="cell-total-calc total-atual-calc cell-val-atual">0,00</span>
                    <input type="hidden" class="input-hidden-total-atual" name="emissores[${emissorIdx}][totais_atual][]" value="0">
                </td>
                <td>
                    <span class="cell-total-calc total-proposto total-proposto-calc cell-val-proposto">0,00</span>
                    <input type="hidden" class="input-hidden-total-proposto" name="emissores[${emissorIdx}][totais_proposto][]" value="0">
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-terceiros-atual cell-readonly cell-val-atual" name="emissores[${emissorIdx}][terceiros_atual][]" value="${tercAtualVal}" placeholder="0,00" readonly disabled tabindex="-1">
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-terceiros-proposto cell-val-proposto" name="emissores[${emissorIdx}][terceiros_proposto][]" value="${tercPropVal || tercAtualVal}" placeholder="0,00" required>
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-rt-atual cell-readonly cell-val-atual" name="emissores[${emissorIdx}][rts_atual][]" value="${rtAtualVal}" placeholder="0,00" readonly disabled tabindex="-1">
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-rt-proposto cell-val-proposto" name="emissores[${emissorIdx}][rts_proposto][]" value="${rtPropVal || rtAtualVal}" placeholder="0,00" required>
                </td>
                <td class="text-center">
                    <button type="button" class="btn-remove-row" title="Remover Linha"><i class="bi bi-trash"></i></button>
                </td>
            `;
        }

        bindRowEvents(tr);
        return tr;
    }

    function bindRowEvents(row) {
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', function () {
                updateEmissorRow(row);
                updateConsolidadoGrupo();
            });
        });

        const btnRemove = row.querySelector('.btn-remove-row');
        if (btnRemove) {
            btnRemove.addEventListener('click', function () {
                row.remove();
                recalculateAll();
            });
        }
    }

    // -------------------------------------------------------------------------
    // 8. OUVINTES DE BOTÕES ADICIONAR PRAZO
    // -------------------------------------------------------------------------
    if (canAddRemoveRows) {
        const btnsAddRow = formSalvar.querySelectorAll('.btn-add-emissor-row');
        btnsAddRow.forEach(btn => {
            btn.addEventListener('click', function () {
                const emissorIdx = btn.dataset.emissorIndex;
                const card = formSalvar.querySelector(`.emissor-card[data-emissor-index="${emissorIdx}"]`);
                if (!card) return;

                const tbody = card.querySelector('.table-emissor-unificada tbody');
                if (tbody) {
                    const newRow = createEmissorTableRow(emissorIdx);
                    tbody.appendChild(newRow);
                    newRow.querySelector('.input-prazo')?.focus();
                    recalculateAll();
                }
            });
        });
    }

    // Conecta eventos nas linhas existentes
    formSalvar.querySelectorAll('.emissor-table-row').forEach(row => bindRowEvents(row));

    // -------------------------------------------------------------------------
    // 9. MODAL LIMITE META
    // -------------------------------------------------------------------------
    const modalElMeta = document.getElementById('modalLimiteMeta');
    const bsModalMeta = modalElMeta ? new bootstrap.Modal(modalElMeta) : null;
    let currentMetaEmissorCard = null;

    const modalTitleMeta = document.getElementById('modalMetaEmissorNome');
    const metaDtVencimento = document.getElementById('metaDtVencimento');
    const metaSelectRating = document.getElementById('metaSelectRating');
    const metaInputShare = document.getElementById('metaInputShare');
    const tabelaModalMetaBody = document.querySelector('#tabelaModalLimiteMeta tbody');
    const btnAddMetaRow = document.getElementById('btnAddMetaRow');
    const btnSalvarModalMeta = document.getElementById('btnSalvarModalMeta');

    function createMetaModalRow(prazo = '', terc = '', rt = '') {
        const tr = document.createElement('tr');
        tr.className = 'meta-modal-row';
        const total = parseVal(terc) + parseVal(rt);

        tr.innerHTML = `
            <td class="text-center">
                <input type="number" step="1" min="1" class="table-input input-meta-prazo" value="${prazo}" placeholder="Prazo" required>
            </td>
            <td>
                <span class="cell-total-calc meta-total-calc">${formatNumber(total)}</span>
            </td>
            <td>
                <input type="number" step="0.01" min="0" class="table-input input-meta-terc" value="${terc}" placeholder="0,00" required>
            </td>
            <td>
                <input type="number" step="0.01" min="0" class="table-input input-meta-rt" value="${rt}" placeholder="0,00" required>
            </td>
            <td class="text-center">
                <button type="button" class="btn-remove-row btn-remove-meta-row" title="Remover"><i class="bi bi-trash"></i></button>
            </td>
        `;

        const inputs = tr.querySelectorAll('input');
        inputs.forEach(inp => {
            inp.addEventListener('input', function () {
                const t = parseVal(tr.querySelector('.input-meta-terc')?.value) + parseVal(tr.querySelector('.input-meta-rt')?.value);
                const spanT = tr.querySelector('.meta-total-calc');
                if (spanT) spanT.textContent = formatNumber(t);
            });
        });

        const btnRem = tr.querySelector('.btn-remove-meta-row');
        if (btnRem) {
            btnRem.addEventListener('click', () => tr.remove());
        }

        return tr;
    }

    if (btnAddMetaRow && tabelaModalMetaBody) {
        btnAddMetaRow.addEventListener('click', function () {
            tabelaModalMetaBody.appendChild(createMetaModalRow());
        });
    }

    const btnRemoverModalMeta = document.getElementById('btnRemoverModalMeta');

    function removerLimiteMetaCurrentCard() {
        if (!currentMetaEmissorCard) return;

        // 1. Limpa metaData no objeto do card
        currentMetaEmissorCard.metaData = null;

        // 2. Remove todos os inputs hidden de limite meta
        const containerHidden = currentMetaEmissorCard.querySelector('.meta-hidden-inputs');
        if (containerHidden) {
            containerHidden.innerHTML = '';
        }

        // 3. Reseta o botão de Limite Meta no card
        const btnMetaCard = currentMetaEmissorCard.querySelector('.btn-open-meta-modal');
        if (btnMetaCard) {
            btnMetaCard.classList.remove('has-meta');
            btnMetaCard.innerHTML = '<i class="bi bi-bullseye me-1"></i>Adicionar Limite Meta';
        }

        // 4. Limpa campos do modal
        if (metaDtVencimento) metaDtVencimento.value = '';
        if (metaSelectRating) metaSelectRating.value = '';
        if (metaInputShare) metaInputShare.value = '';
        if (tabelaModalMetaBody) tabelaModalMetaBody.innerHTML = '';

        if (bsModalMeta) bsModalMeta.hide();
        recalculateAll();
    }

    if (btnRemoverModalMeta) {
        btnRemoverModalMeta.addEventListener('click', removerLimiteMetaCurrentCard);
    }

    const btnsOpenMeta = formSalvar.querySelectorAll('.btn-open-meta-modal');
    btnsOpenMeta.forEach(btn => {
        btn.addEventListener('click', function () {
            const emissorIdx = btn.dataset.emissorIndex;
            const emissorNome = btn.dataset.emissorNome || `Emissor #${parseInt(emissorIdx) + 1}`;
            currentMetaEmissorCard = formSalvar.querySelector(`.emissor-card[data-emissor-index="${emissorIdx}"]`);

            if (modalTitleMeta) modalTitleMeta.textContent = `Limite Meta — ${emissorNome}`;
            if (tabelaModalMetaBody) tabelaModalMetaBody.innerHTML = '';

            const hasMeta = currentMetaEmissorCard && currentMetaEmissorCard.metaData && Array.isArray(currentMetaEmissorCard.metaData.rows) && currentMetaEmissorCard.metaData.rows.length > 0;
            if (btnRemoverModalMeta) {
                btnRemoverModalMeta.style.display = hasMeta ? 'inline-block' : 'none';
            }

            // Restaura dados de limite meta salvos no card
            if (hasMeta) {
                const meta = currentMetaEmissorCard.metaData;
                if (metaDtVencimento) metaDtVencimento.value = meta.dtVencimento || '';
                if (metaSelectRating) metaSelectRating.value = meta.cdRating || '';
                if (metaInputShare) metaInputShare.value = meta.shareDivida || '';

                meta.rows.forEach(r => tabelaModalMetaBody.appendChild(createMetaModalRow(r.prazo, r.terceiros, r.rt)));
            } else {
                if (metaDtVencimento) metaDtVencimento.value = '';
                if (metaSelectRating) metaSelectRating.value = '';
                if (metaInputShare) metaInputShare.value = '';
                tabelaModalMetaBody.appendChild(createMetaModalRow());
            }

            if (bsModalMeta) bsModalMeta.show();
        });
    });

    if (btnSalvarModalMeta) {
        btnSalvarModalMeta.addEventListener('click', function () {
            if (!currentMetaEmissorCard) return;

            const dtVenc = metaDtVencimento ? metaDtVencimento.value : '';
            const ratingMeta = metaSelectRating ? metaSelectRating.value : '';
            const shareMeta = metaInputShare ? metaInputShare.value : '';

            const metaRows = [];
            const rows = tabelaModalMetaBody ? tabelaModalMetaBody.querySelectorAll('.meta-modal-row') : [];
            rows.forEach(r => {
                const prazo = r.querySelector('.input-meta-prazo')?.value?.trim();
                const terc = r.querySelector('.input-meta-terc')?.value?.trim();
                const rt = r.querySelector('.input-meta-rt')?.value?.trim();
                if (prazo && (terc || rt)) {
                    metaRows.push({ prazo: parseInt(prazo, 10), terceiros: parseVal(terc), rt: parseVal(rt) });
                }
            });

            // Se não houver prazos/linhas preenchidas, remove o limite meta completamente
            if (metaRows.length === 0) {
                removerLimiteMetaCurrentCard();
                return;
            }

            currentMetaEmissorCard.metaData = {
                dtVencimento: dtVenc,
                cdRating: ratingMeta,
                shareDivida: shareMeta,
                rows: metaRows
            };

            // Atualiza ou cria hidden inputs dentro do card
            const emissorIdx = currentMetaEmissorCard.dataset.emissorIndex;
            let containerHidden = currentMetaEmissorCard.querySelector('.meta-hidden-inputs');
            if (!containerHidden) {
                containerHidden = document.createElement('div');
                containerHidden.className = 'meta-hidden-inputs d-none';
                currentMetaEmissorCard.appendChild(containerHidden);
            }

            let htmlHiddens = '';
            if (dtVenc) htmlHiddens += `<input type="hidden" name="emissores[${emissorIdx}][meta][dtVencimento]" value="${dtVenc}">`;
            if (ratingMeta) htmlHiddens += `<input type="hidden" name="emissores[${emissorIdx}][meta][cdRating]" value="${ratingMeta}">`;
            if (shareMeta) htmlHiddens += `<input type="hidden" name="emissores[${emissorIdx}][meta][shareDivida]" value="${shareMeta}">`;

            metaRows.forEach((r, rIdx) => {
                htmlHiddens += `
                    <input type="hidden" name="emissores[${emissorIdx}][meta][rows][${rIdx}][prazo]" value="${r.prazo}">
                    <input type="hidden" name="emissores[${emissorIdx}][meta][rows][${rIdx}][terceiros]" value="${r.terceiros}">
                    <input type="hidden" name="emissores[${emissorIdx}][meta][rows][${rIdx}][rt]" value="${r.rt}">
                `;
            });

            containerHidden.innerHTML = htmlHiddens;

            // Altera visual do botão de Limite Meta no card para destacar que está configurado
            const btnMetaCard = currentMetaEmissorCard.querySelector('.btn-open-meta-modal');
            if (btnMetaCard) {
                btnMetaCard.classList.add('has-meta');
                btnMetaCard.innerHTML = `<i class="bi bi-check2-circle me-1"></i>Limite Meta (${metaRows.length} prazos)`;
            }

            if (bsModalMeta) bsModalMeta.hide();
            recalculateAll();
        });
    }

    // -------------------------------------------------------------------------
    // 10. VALIDAÇÃO E SUBMISSÃO DO FORMULÁRIO
    // -------------------------------------------------------------------------
    formSalvar.addEventListener('submit', function (e) {
        let hasError = false;
        let errorMessage = '';

        // Atualiza requisitos de campos dinâmicos antes de validar
        updateEmissoresRatingRequirement();

        // 1. Validação padrão HTML5
        if (!formSalvar.checkValidity()) {
            hasError = true;
            errorMessage = 'Por favor, preencha todos os campos obrigatórios (*) destacados no formulário.';
        }

        // 2. Validação condicional de Rating por emissor
        const emissorCards = formSalvar.querySelectorAll('.emissor-card');
        if (!isRatingOnly && !isRatingRunoff) {
            emissorCards.forEach(card => {
                const rows = card.querySelectorAll('.emissor-table-row');
                const hasMeta = card.metaData && Array.isArray(card.metaData.rows) && card.metaData.rows.length > 0;
                const selectRating = card.querySelector('.select-rating-proposto-emissor');
                const emissorNome = card.dataset.emissorNome || 'Emissor';

                if (rows.length > 0 || hasMeta) {
                    if (!selectRating || !selectRating.value || selectRating.value.trim() === '') {
                        hasError = true;
                        if (selectRating) selectRating.classList.add('is-invalid');
                        if (!errorMessage) {
                            errorMessage = `Por favor, selecione o Rating Proposto para o emissor "${emissorNome}".`;
                        }
                    } else if (selectRating) {
                        selectRating.classList.remove('is-invalid');
                    }
                } else if (selectRating) {
                    selectRating.classList.remove('is-invalid');
                }
            });
        }

        // 3. Validação de Prazos Duplicados dentro do mesmo emissor
        emissorCards.forEach(card => {
            const prazos = [];
            const rows = card.querySelectorAll('.emissor-table-row');
            rows.forEach(row => {
                const inputPrazo = row.querySelector('.input-prazo');
                const p = inputPrazo ? inputPrazo.value.trim() : '';
                if (p) {
                    if (prazos.includes(p)) {
                        hasError = true;
                        inputPrazo.classList.add('is-invalid');
                        errorMessage = 'Não é permitido cadastrar prazos duplicados para o mesmo emissor.';
                    } else {
                        prazos.push(p);
                        inputPrazo.classList.remove('is-invalid');
                    }
                }
            });
        });

        // 3. Validação de Flexibilização sem Alteração de LMAX (Soma constante / Delta == 0)
        if (isFlexSemLmax) {
            const consolidadoPorPrazo = {};
            emissorCards.forEach(card => {
                const rows = card.querySelectorAll('.emissor-table-row');
                rows.forEach(row => {
                    const inputPrazo = row.querySelector('.input-prazo');
                    const p = inputPrazo ? inputPrazo.value.trim() : '';
                    if (!p) return;

                    const prazo = parseInt(p, 10);
                    if (!consolidadoPorPrazo[prazo]) consolidadoPorPrazo[prazo] = { atual: 0, prop: 0 };

                    const inputTercProp = row.querySelector('.input-terceiros-proposto');
                    const inputRtProp = row.querySelector('.input-rt-proposto');
                    const inputTercAtual = row.querySelector('.input-terceiros-atual');
                    const inputRtAtual = row.querySelector('.input-rt-atual');

                    consolidadoPorPrazo[prazo].prop += (parseVal(inputTercProp?.value) + parseVal(inputRtProp?.value));
                    consolidadoPorPrazo[prazo].atual += (parseVal(inputTercAtual?.value) + parseVal(inputRtAtual?.value));
                });
            });

            for (const [prazo, dados] of Object.entries(consolidadoPorPrazo)) {
                const delta = dados.prop - dados.atual;
                if (Math.abs(delta) > 0.01) {
                    hasError = true;
                    errorMessage = `Flexibilização sem alteração de LMAX inválida: o prazo de ${prazo} possui desequilíbrio de ${delta > 0 ? '+' : ''}${formatCurrency(delta)}. A soma dos emissores deve permanecer igual ao Total Atual.`;
                    break;
                }
            }
        }

        // 4. Validação de Teto de Flexibilização com aumento de LMAX
        if (isFlexibilizacao) {
            emissorCards.forEach(card => {
                const idEmissor = card.dataset.emissorId || '';
                const dsEmissor = (card.dataset.emissorNome || '').toLowerCase().trim();
                const rows = card.querySelectorAll('.emissor-table-row');

                rows.forEach(row => {
                    const inputPrazo = row.querySelector('.input-prazo');
                    const prazo = inputPrazo ? parseVal(inputPrazo.value) : 0;
                    const valDisp = flexDisponivelMap[`${idEmissor}_${prazo}`] !== undefined ? flexDisponivelMap[`${idEmissor}_${prazo}`] : (flexDisponivelMap[`${dsEmissor}_${prazo}`] || 0);

                    const inputTercAtual = row.querySelector('.input-terceiros-atual');
                    const inputRtAtual = row.querySelector('.input-rt-atual');
                    const totalAtual = parseVal(inputTercAtual?.value) + parseVal(inputRtAtual?.value);
                    const teto = totalAtual + valDisp;

                    const inputTercProp = row.querySelector('.input-terceiros-proposto');
                    const inputRtProp = row.querySelector('.input-rt-proposto');
                    const totalProp = parseVal(inputTercProp?.value) + parseVal(inputRtProp?.value);

                    if (totalProp > (teto + 0.01)) {
                        hasError = true;
                        errorMessage = `Valor proposto no prazo ${prazo} excede o limite máximo permitido de flexibilização (${formatCurrency(teto)}).`;
                    }
                });
            });
        }

        if (hasError) {
            e.preventDefault();
            formSalvar.classList.add('was-validated');
            alert(errorMessage);
            return;
        }

        // Loading no botão de envio
        const btnSubmit = document.getElementById('btnSalvarSolicitacao');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enviando solicitação...';
        }
    });

    // -------------------------------------------------------------------------
    // 11. RESTAURAÇÃO DE LIMITES META PRÉ-CARREGADOS (MODO EDIÇÃO)
    // -------------------------------------------------------------------------
    const emissorCardsInit = formSalvar.querySelectorAll('.emissor-card');
    emissorCardsInit.forEach(card => {
        const emissorIdx = card.dataset.emissorIndex;
        const containerHidden = card.querySelector('.meta-hidden-inputs');
        if (containerHidden) {
            const dtVencInput = containerHidden.querySelector(`input[name="emissores[${emissorIdx}][meta][dtVencimento]"]`);
            const cdRatingInput = containerHidden.querySelector(`input[name="emissores[${emissorIdx}][meta][cdRating]"]`);
            const shareInput = containerHidden.querySelector(`input[name="emissores[${emissorIdx}][meta][shareDivida]"]`);

            const metaRows = [];
            let rIdx = 0;
            while (true) {
                const prazoInput = containerHidden.querySelector(`input[name="emissores[${emissorIdx}][meta][rows][${rIdx}][prazo]"]`);
                const tercInput = containerHidden.querySelector(`input[name="emissores[${emissorIdx}][meta][rows][${rIdx}][terceiros]"]`);
                const rtInput = containerHidden.querySelector(`input[name="emissores[${emissorIdx}][meta][rows][${rIdx}][rt]"]`);
                if (!prazoInput) break;

                const p = parseInt(prazoInput.value, 10);
                if (!isNaN(p)) {
                    metaRows.push({
                        prazo: p,
                        terceiros: parseVal(tercInput?.value),
                        rt: parseVal(rtInput?.value)
                    });
                }
                rIdx++;
            }

            if (metaRows.length > 0) {
                card.metaData = {
                    dtVencimento: dtVencInput ? dtVencInput.value : '',
                    cdRating: cdRatingInput ? cdRatingInput.value : '',
                    shareDivida: shareInput ? shareInput.value : '',
                    rows: metaRows
                };
                const btnMetaCard = card.querySelector('.btn-open-meta-modal');
                if (btnMetaCard) {
                    btnMetaCard.classList.add('has-meta');
                    btnMetaCard.innerHTML = `<i class="bi bi-check2-circle me-1"></i>Limite Meta (${metaRows.length} prazos)`;
                }
            }
        }
    });

    // Inicialização dos cálculos em tela
    recalculateAll();
});

