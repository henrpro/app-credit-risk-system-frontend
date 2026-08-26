document.addEventListener('DOMContentLoaded', function () {
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

    // Mapeamento de flexibilização disponível por [idEmissor_prazo] ou [dsEmissor_prazo]
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

    const formSalvar = document.getElementById('formSalvarSolicitacaoAlcada');
    const tipoEvento = formSalvar ? (formSalvar.dataset.tipoEvento || '') : '';
    const isAbertura = formSalvar ? (formSalvar.dataset.isAbertura === '1') : false;

    const isProrrogacao = (tipoEvento === 'Prorrogação');
    const isRatingRunOff = ['Downgrade de Rating', 'Upgrade de Rating', 'Downgrade de Rating + Run-Off', 'Upgrade de Rating + Run-Off', 'Run-Off'].includes(tipoEvento);
    const isFlexibilizacao = (tipoEvento === 'Flexibilização');
    const isFlexSemLmax = (tipoEvento === 'Flexibilização sem Alteração de LMAX');
    const canEditLimits = !isProrrogacao && !isRatingRunOff;
    const canEditRating = !isProrrogacao && (tipoEvento !== 'Run-Off');

    function parseVal(val) {
        if (!val || val === '') return 0;
        const num = parseFloat(String(val).replace(',', '.'));
        return isNaN(num) ? 0 : num;
    }

    function formatNumber(num) {
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function buildRatingsSelectOptions(selectedValue = '') {
        let html = '<option value="">Selecione...</option>';
        ratingsOptions.forEach(r => {
            const cod = typeof r === 'object' && r !== null ? (r.cdRating || r.codigo || r.idRating || r) : r;
            const isSelected = String(cod) === String(selectedValue) ? 'selected' : '';
            html += `<option value="${cod}" ${isSelected}>${cod}</option>`;
        });
        return html;
    }

    function createEmissorTableRow(emissorIdx, rowData = {}) {
        const tr = document.createElement('tr');
        tr.className = 'emissor-table-row';

        const prazoVal = rowData.prazo !== undefined && rowData.prazo !== null ? rowData.prazo : '';
        const tercAtualVal = rowData.terceirosAtual !== undefined && rowData.terceirosAtual !== null ? rowData.terceirosAtual : '';
        const tercPropVal = rowData.terceirosProposto !== undefined && rowData.terceirosProposto !== null ? rowData.terceirosProposto : (isAbertura ? '' : tercAtualVal);
        const rtAtualVal = rowData.rtAtual !== undefined && rowData.rtAtual !== null ? rowData.rtAtual : '';
        const rtPropVal = rowData.rtProposto !== undefined && rowData.rtProposto !== null ? rowData.rtProposto : (isAbertura ? '' : rtAtualVal);

        const totalAtualCalc = parseVal(tercAtualVal) + parseVal(rtAtualVal);
        const totalPropCalc = parseVal(tercPropVal) + parseVal(rtPropVal);

        if (isAbertura) {
            // Modo Abertura de Limite: Apenas colunas propostas
            tr.innerHTML = `
                <td class="text-center">
                    <input type="number" step="1" min="1" class="table-input input-prazo" name="emissores[${emissorIdx}][prazos][]" value="${prazoVal}" required>
                    <div class="row-validation-feedback cascade-feedback d-none"></div>
                </td>
                <td>
                    <span class="cell-total-calc total-proposto total-proposto-calc cell-val-proposto">${formatNumber(totalPropCalc)}</span>
                    <input type="hidden" class="input-hidden-total-proposto" name="emissores[${emissorIdx}][totais_proposto][]" value="${totalPropCalc}">
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
            // Modo Geral: Colunas Atual (somente leitura) e Proposto
            tr.innerHTML = `
                <td class="text-center">
                    <input type="number" step="1" min="1" class="table-input input-prazo" name="emissores[${emissorIdx}][prazos][]" value="${prazoVal}" required ${!canEditLimits ? 'readonly disabled' : ''}>
                    <div class="row-validation-feedback cascade-feedback d-none"></div>
                </td>
                <td>
                    <span class="cell-total-calc total-atual-calc cell-val-atual">${formatNumber(totalAtualCalc)}</span>
                    <input type="hidden" class="input-hidden-total-atual" name="emissores[${emissorIdx}][totais_atual][]" value="${totalAtualCalc}">
                </td>
                <td>
                    <span class="cell-total-calc total-proposto total-proposto-calc cell-val-proposto">${formatNumber(totalPropCalc)}</span>
                    <input type="hidden" class="input-hidden-total-proposto" name="emissores[${emissorIdx}][totais_proposto][]" value="${totalPropCalc}">
                    <div class="row-validation-feedback flex-feedback d-none"></div>
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-terceiros-atual cell-readonly cell-val-atual" name="emissores[${emissorIdx}][terceiros_atual][]" value="${tercAtualVal}" placeholder="0,00" readonly disabled tabindex="-1">
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-terceiros-proposto cell-val-proposto" name="emissores[${emissorIdx}][terceiros_proposto][]" value="${tercPropVal}" placeholder="0,00" required ${!canEditLimits ? 'readonly disabled' : ''}>
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-rt-atual cell-readonly cell-val-atual" name="emissores[${emissorIdx}][rts_atual][]" value="${rtAtualVal}" placeholder="0,00" readonly disabled tabindex="-1">
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="table-input input-rt-proposto cell-val-proposto" name="emissores[${emissorIdx}][rts_proposto][]" value="${rtPropVal}" placeholder="0,00" required ${!canEditLimits ? 'readonly disabled' : ''}>
                </td>
                ${canEditLimits ? `
                <td class="text-center">
                    <button type="button" class="btn-remove-row" title="Remover Linha"><i class="bi bi-trash"></i></button>
                </td>` : ''}
            `;
        }

        attachEmissorRowEvents(tr);
        return tr;
    }

    function attachEmissorRowEvents(row) {
        const numInputs = row.querySelectorAll('.input-terceiros-atual, .input-terceiros-proposto, .input-rt-atual, .input-rt-proposto, .input-prazo');
        numInputs.forEach(input => {
            input.addEventListener('input', function () {
                updateRowTotals(row);
                recalculateAll();
            });
            input.addEventListener('change', function () {
                updateRowTotals(row);
                recalculateAll();
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

    function updateRowTotals(row) {
        const tercAtual = parseVal(row.querySelector('.input-terceiros-atual')?.value);
        const rtAtual = parseVal(row.querySelector('.input-rt-atual')?.value);
        const totalAtual = tercAtual + rtAtual;

        const spanTotalAtual = row.querySelector('.total-atual-calc');
        const hiddenTotalAtual = row.querySelector('.input-hidden-total-atual');
        if (spanTotalAtual) spanTotalAtual.textContent = formatNumber(totalAtual);
        if (hiddenTotalAtual) hiddenTotalAtual.value = totalAtual;

        const tercProp = parseVal(row.querySelector('.input-terceiros-proposto')?.value);
        const rtProp = parseVal(row.querySelector('.input-rt-proposto')?.value);
        const totalProp = tercProp + rtProp;

        const spanTotalProp = row.querySelector('.total-proposto-calc');
        const hiddenTotalProp = row.querySelector('.input-hidden-total-proposto');
        if (spanTotalProp) spanTotalProp.textContent = formatNumber(totalProp);
        if (hiddenTotalProp) hiddenTotalProp.value = totalProp;
    }

    function recalculateEmissorFooter(tableEl) {
        if (!tableEl) return;
        const tbody = tableEl.querySelector('tbody');
        const rows = tbody ? Array.from(tbody.querySelectorAll('tr.emissor-table-row')) : [];

        const emissorCard = tableEl.closest('.emissor-card');
        const emissorId = emissorCard ? emissorCard.dataset.emissorId : '';
        const emissorNome = emissorCard ? (emissorCard.dataset.emissorNome || '').trim().toLowerCase() : '';

        // Coleta dados das linhas válidas do emissor para verificação de cascata
        const parsedRows = [];
        rows.forEach(row => {
            updateRowTotals(row);

            const prazoInput = row.querySelector('.input-prazo');
            const prazoStr = prazoInput ? prazoInput.value.trim() : '';
            const prazoNum = parseInt(prazoStr, 10);

            const tercAtual = parseVal(row.querySelector('.input-terceiros-atual')?.value);
            const rtAtual = parseVal(row.querySelector('.input-rt-atual')?.value);
            const totalAtual = tercAtual + rtAtual;

            const tercProp = parseVal(row.querySelector('.input-terceiros-proposto')?.value);
            const rtProp = parseVal(row.querySelector('.input-rt-proposto')?.value);
            const totalProp = tercProp + rtProp;

            if (!isNaN(prazoNum) && prazoStr !== '') {
                parsedRows.push({
                    rowEl: row,
                    prazo: prazoNum,
                    tercAtual: tercAtual,
                    rtAtual: rtAtual,
                    totalAtual: totalAtual,
                    tercProp: tercProp,
                    rtProp: rtProp,
                    totalProp: totalProp
                });
            }
        });

        // Ordena por prazo crescente para validação de cascata: P1 < P2 < P3...
        parsedRows.sort((a, b) => a.prazo - b.prazo);

        // O valor de um prazo menor DEVE ser >= ao de um prazo maior: Total(P_i) >= Total(P_i+1)
        for (let i = 0; i < parsedRows.length; i++) {
            const current = parsedRows[i];
            const cascadeFeedback = current.rowEl.querySelector('.cascade-feedback');
            current.rowEl.classList.remove('cascade-violation');
            if (cascadeFeedback) {
                cascadeFeedback.classList.add('d-none');
                cascadeFeedback.textContent = '';
            }

            if (i > 0) {
                const prev = parsedRows[i - 1];
                // Se o prazo maior tiver valor total estritamente maior que o prazo menor
                if (current.totalProp > prev.totalProp + 0.001) {
                    current.rowEl.classList.add('cascade-violation');
                    if (cascadeFeedback) {
                        cascadeFeedback.classList.remove('d-none');
                        cascadeFeedback.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i>Cascata inválida: prazo ${current.prazo} anos (${formatNumber(current.totalProp)}) > ${prev.prazo} anos (${formatNumber(prev.totalProp)})`;
                    }
                }
            }
        }

        if (isFlexibilizacao) {
            parsedRows.forEach(item => {
                const disp = flexDisponivelMap[`${emissorId}_${item.prazo}`] ?? flexDisponivelMap[`${emissorNome}_${item.prazo}`] ?? 0;
                const maxPermitido = item.totalAtual + disp;

                const flexFeedback = item.rowEl.querySelector('.flex-feedback');
                item.rowEl.classList.remove('flex-violation');
                if (flexFeedback) {
                    flexFeedback.classList.add('d-none');
                    flexFeedback.textContent = '';
                }

                if (item.totalProp > maxPermitido + 0.001) {
                    item.rowEl.classList.add('flex-violation');
                    if (flexFeedback) {
                        flexFeedback.classList.remove('d-none');
                        flexFeedback.innerHTML = `<i class="bi bi-shield-exclamation me-1"></i>Teto flexibilização excedido: Máx ${formatNumber(maxPermitido)} (Atual ${formatNumber(item.totalAtual)} + Flex ${formatNumber(disp)})`;
                    }
                }
            });
        }

        let maxTotalAtual = 0;
        let maxTotalProp = 0;
        let maxTercAtual = 0;
        let maxTercProp = 0;
        let maxRtAtual = 0;
        let maxRtProp = 0;

        parsedRows.forEach(item => {
            if (item.totalAtual > maxTotalAtual) maxTotalAtual = item.totalAtual;
            if (item.totalProp > maxTotalProp) maxTotalProp = item.totalProp;
            if (item.tercAtual > maxTercAtual) maxTercAtual = item.tercAtual;
            if (item.tercProp > maxTercProp) maxTercProp = item.tercProp;
            if (item.rtAtual > maxRtAtual) maxRtAtual = item.rtAtual;
            if (item.rtProp > maxRtProp) maxRtProp = item.rtProp;
        });

        // Armazena as exposições máximas no elemento para consolidação rápida do grupo
        tableEl.dataset.maxTotalAtual = maxTotalAtual;
        tableEl.dataset.maxTotalProp = maxTotalProp;
        tableEl.dataset.maxTercAtual = maxTercAtual;
        tableEl.dataset.maxTercProp = maxTercProp;
        tableEl.dataset.maxRtAtual = maxRtAtual;
        tableEl.dataset.maxRtProp = maxRtProp;

        const spanTotAtual = tableEl.querySelector('.emissor-sum-total-atual');
        const spanTotProp = tableEl.querySelector('.emissor-sum-total-proposto');
        const spanTercAtual = tableEl.querySelector('.emissor-sum-terceiros-atual');
        const spanTercProp = tableEl.querySelector('.emissor-sum-terceiros-proposto');
        const spanRtAtual = tableEl.querySelector('.emissor-sum-rt-atual');
        const spanRtProp = tableEl.querySelector('.emissor-sum-rt-proposto');

        if (spanTotAtual) spanTotAtual.textContent = formatNumber(maxTotalAtual);
        if (spanTotProp) spanTotProp.textContent = formatNumber(maxTotalProp);
        if (spanTercAtual) spanTercAtual.textContent = formatNumber(maxTercAtual);
        if (spanTercProp) spanTercProp.textContent = formatNumber(maxTercProp);
        if (spanRtAtual) spanRtAtual.textContent = formatNumber(maxRtAtual);
        if (spanRtProp) spanRtProp.textContent = formatNumber(maxRtProp);
    }

    function recalculateGrupoConsolidated() {
        const grupoTable = document.getElementById('tabelaGrupoConsolidada');
        if (!grupoTable) return;

        const grupoTbody = grupoTable.querySelector('tbody');
        if (!grupoTbody) return;

        const emissorTables = document.querySelectorAll('.table-emissor-unificada');
        const mapPrazos = {}; // prazo -> { totalAtual, totalProp, tercAtual, tercProp, rtAtual, rtProp }
        const globalPrazosSet = new Set();
        const emissoresData = [];

        emissorTables.forEach(table => {
            const emissorIdx = table.dataset.emissorIndex;
            const rows = table.querySelectorAll('tbody tr.emissor-table-row');
            const emissorRowsData = [];
            const emissorMetaRowsData = [];

            // Extrai limites normais
            rows.forEach(row => {
                const prazoInput = row.querySelector('.input-prazo');
                const prazoStr = prazoInput ? prazoInput.value.trim() : '';

                if (prazoStr !== '') {
                    const prazoKey = parseInt(prazoStr, 10);
                    if (!isNaN(prazoKey)) {
                        globalPrazosSet.add(prazoKey);
                        emissorRowsData.push({
                            prazo: prazoKey,
                            tercAtual: parseVal(row.querySelector('.input-terceiros-atual')?.value),
                            rtAtual: parseVal(row.querySelector('.input-rt-atual')?.value),
                            tercProp: parseVal(row.querySelector('.input-terceiros-proposto')?.value),
                            rtProp: parseVal(row.querySelector('.input-rt-proposto')?.value),
                        });
                    }
                }
            });
            emissorRowsData.sort((a, b) => a.prazo - b.prazo);

            // Extrai limites meta
            const metaData = metaDataByEmissor[emissorIdx];
            if (metaData && metaData.rows) {
                metaData.rows.forEach(r => {
                    const prazoKey = parseInt(r.prazo, 10);
                    if (!isNaN(prazoKey)) {
                        globalPrazosSet.add(prazoKey);
                        emissorMetaRowsData.push({
                            prazo: prazoKey,
                            tercProp: parseFloat(r.terceirosProposto) || 0,
                            rtProp: parseFloat(r.rtProposto) || 0,
                        });
                    }
                });
                emissorMetaRowsData.sort((a, b) => a.prazo - b.prazo);
            }

            emissoresData.push({
                normal: emissorRowsData,
                meta: emissorMetaRowsData
            });
        });

        const prazosOrdenados = Array.from(globalPrazosSet).sort((a, b) => a - b);
        grupoTbody.innerHTML = '';

        if (prazosOrdenados.length === 0) {
            const colspan = isAbertura ? 4 : 7;
            grupoTbody.innerHTML = `
                <tr>
                    <td colspan="${colspan}" class="text-center text-muted py-3">
                        <i class="bi bi-info-circle me-1"></i>Preencha os prazos e limites nos emissores abaixo para visualizar a consolidação automática do grupo.
                    </td>
                </tr>
            `;
        } else {
            prazosOrdenados.forEach(P => {
                mapPrazos[P] = { totalAtual: 0, totalProp: 0, tercAtual: 0, tercProp: 0, rtAtual: 0, rtProp: 0 };
                
                emissoresData.forEach(emissor => {
                    let n_tercAtual = 0, n_rtAtual = 0, n_tercProp = 0, n_rtProp = 0;
                    let m_tercProp = 0, m_rtProp = 0;

                    // Cascata Limite Normal
                    const normalRow = emissor.normal.find(r => r.prazo >= P);
                    if (normalRow) {
                        n_tercAtual = normalRow.tercAtual;
                        n_rtAtual = normalRow.rtAtual;
                        n_tercProp = normalRow.tercProp;
                        n_rtProp = normalRow.rtProp;
                    }

                    // Cascata Limite Meta
                    const metaRow = emissor.meta.find(r => r.prazo >= P);
                    if (metaRow) {
                        m_tercProp = metaRow.tercProp;
                        m_rtProp = metaRow.rtProp;
                    }

                    const n_totalProp = n_tercProp + n_rtProp;
                    const m_totalProp = m_tercProp + m_rtProp;

                    // Regra: Considera o maior Total Proposto (Normal vs Meta)
                    let chosen_tercProp = n_tercProp;
                    let chosen_rtProp = n_rtProp;

                    if (m_totalProp > n_totalProp) {
                        chosen_tercProp = m_tercProp;
                        chosen_rtProp = m_rtProp;
                    }

                    mapPrazos[P].tercAtual += n_tercAtual;
                    mapPrazos[P].rtAtual += n_rtAtual;
                    mapPrazos[P].tercProp += chosen_tercProp;
                    mapPrazos[P].rtProp += chosen_rtProp;
                    mapPrazos[P].totalAtual += (n_tercAtual + n_rtAtual);
                    mapPrazos[P].totalProp += (chosen_tercProp + chosen_rtProp);
                });
                
                const item = mapPrazos[P];
                const tr = document.createElement('tr');

                // Trava de LMAX Global (Flexibilização sem Alteração de LMAX)
                let lmaxViolation = false;
                if (isFlexSemLmax && item.totalProp > item.totalAtual + 0.001) {
                    lmaxViolation = true;
                    tr.className = 'lmax-violation';
                }

                if (isAbertura) {
                    tr.innerHTML = `
                        <td class="text-center th-prazo-val">${P}</td>
                        <td class="text-end cell-val-proposto">${formatNumber(item.totalProp)}</td>
                        <td class="text-end cell-val-proposto">${formatNumber(item.tercProp)}</td>
                        <td class="text-end cell-val-proposto">${formatNumber(item.rtProp)}</td>
                    `;
                } else {
                    tr.innerHTML = `
                        <td class="text-center th-prazo-val">${P}</td>
                        <td class="text-end cell-val-atual">${formatNumber(item.totalAtual)}</td>
                        <td class="text-end cell-val-proposto ${lmaxViolation ? 'text-danger fw-bold' : ''}">
                            ${formatNumber(item.totalProp)}
                            ${lmaxViolation ? '<span class="badge bg-danger ms-1" title="Limite total do grupo para este prazo não pode ser aumentado">LMAX Excedido</span>' : ''}
                        </td>
                        <td class="text-end cell-val-atual">${formatNumber(item.tercAtual)}</td>
                        <td class="text-end cell-val-proposto">${formatNumber(item.tercProp)}</td>
                        <td class="text-end cell-val-atual">${formatNumber(item.rtAtual)}</td>
                        <td class="text-end cell-val-proposto">${formatNumber(item.rtProp)}</td>
                    `;
                }
                grupoTbody.appendChild(tr);
            });
        }
    }


    function recalculateAll() {
        const allEmissorTables = document.querySelectorAll('.table-emissor-unificada');
        allEmissorTables.forEach(table => {
            recalculateEmissorFooter(table);
        });
        recalculateGrupoConsolidated();
    }

    // Botões de Adicionar Linha nas tabelas dos emissores
    const btnAddEmissorRows = document.querySelectorAll('.btn-add-emissor-row');
    btnAddEmissorRows.forEach(btn => {
        btn.addEventListener('click', function () {
            const emissorIdx = btn.dataset.emissorIndex;
            const table = document.querySelector(`.table-emissor-unificada[data-emissor-index="${emissorIdx}"]`);
            if (table) {
                const tbody = table.querySelector('tbody');
                if (tbody) {
                    const newRow = createEmissorTableRow(emissorIdx);
                    tbody.appendChild(newRow);
                    const firstInput = newRow.querySelector('.input-prazo');
                    if (firstInput) firstInput.focus();
                    recalculateAll();
                }
            }
        });
    });

    // Conecta eventos nas linhas já renderizadas
    const existingEmissorRows = document.querySelectorAll('.emissor-table-row');
    existingEmissorRows.forEach(row => {
        attachEmissorRowEvents(row);
    });

    // Switch Run-Off Interactivity
    const checkRunOffs = document.querySelectorAll('.check-run-off');
    checkRunOffs.forEach(cb => {
        cb.addEventListener('change', function () {
            // Checkbox nativo já atualiza seu estado 'checked' e envia value="1" se marcado
        });
    });

    const modalEl = document.getElementById('modalLimiteMeta');
    const bsModal = modalEl ? new bootstrap.Modal(modalEl) : null;
    let currentMetaEmissorIdx = null;

    // Estrutura de armazenamento de meta por emissor
    const metaDataByEmissor = {};

    function createMetaTableRow(rowData = {}) {
        const tr = document.createElement('tr');
        tr.className = 'meta-table-row';

        const prazoVal = rowData.prazo !== undefined && rowData.prazo !== null ? rowData.prazo : '';
        const tercPropVal = rowData.terceirosProposto !== undefined && rowData.terceirosProposto !== null ? rowData.terceirosProposto : '';
        const rtPropVal = rowData.rtProposto !== undefined && rowData.rtProposto !== null ? rowData.rtProposto : '';
        const totalPropCalc = parseVal(tercPropVal) + parseVal(rtPropVal);

        tr.innerHTML = `
            <td class="text-center">
                <input type="number" step="1" min="0" class="table-input input-prazo input-prazo-meta" value="${prazoVal}" required>
            </td>
            <td>
                <span class="cell-total-calc total-proposto total-meta-calc cell-val-proposto">${formatNumber(totalPropCalc)}</span>
            </td>
            <td>
                <input type="number" step="0.01" min="0" class="table-input input-terceiros-meta cell-val-proposto" value="${tercPropVal}" placeholder="0,00">
            </td>
            <td>
                <input type="number" step="0.01" min="0" class="table-input input-rt-meta cell-val-proposto" value="${rtPropVal}" placeholder="0,00">
            </td>
            <td class="text-center">
                <button type="button" class="btn-remove-row btn-remove-meta-row" title="Remover"><i class="bi bi-trash"></i></button>
            </td>
        `;

        attachMetaRowEvents(tr);
        return tr;
    }

    function attachMetaRowEvents(row) {
        const inputs = row.querySelectorAll('.input-terceiros-meta, .input-rt-meta, .input-prazo-meta');
        inputs.forEach(input => {
            input.addEventListener('input', function () {
                updateMetaRowTotals(row);
            });
        });

        const btnRemove = row.querySelector('.btn-remove-meta-row');
        if (btnRemove) {
            btnRemove.addEventListener('click', function () {
                const tbody = row.closest('tbody');
                row.remove();
                if (tbody && tbody.children.length === 0) {
                    tbody.appendChild(createMetaTableRow());
                }
            });
        }
    }

    function updateMetaRowTotals(row) {
        const terc = parseVal(row.querySelector('.input-terceiros-meta')?.value);
        const rt = parseVal(row.querySelector('.input-rt-meta')?.value);
        const total = terc + rt;
        const span = row.querySelector('.total-meta-calc');
        if (span) span.textContent = formatNumber(total);
    }

    // Botão Adicionar Linha dentro do Modal
    const btnAddMetaRow = document.getElementById('btnAddMetaRow');
    if (btnAddMetaRow) {
        btnAddMetaRow.addEventListener('click', function () {
            const tbody = document.querySelector('#tabelaModalLimiteMeta tbody');
            if (tbody) {
                const newRow = createMetaTableRow();
                tbody.appendChild(newRow);
                const firstInput = newRow.querySelector('.input-prazo-meta');
                if (firstInput) firstInput.focus();
                recalculateMetaFooter();
            }
        });
    }

    // Abrir Modal de Limite Meta ao clicar em "Adicionar Limite Meta"
    const btnOpenMetas = document.querySelectorAll('.btn-open-meta-modal');
    btnOpenMetas.forEach(btn => {
        btn.addEventListener('click', function () {
            currentMetaEmissorIdx = btn.dataset.emissorIndex;
            const emissorNome = btn.dataset.emissorNome || `Emissor #${parseInt(currentMetaEmissorIdx) + 1}`;

            const modalTitleEl = document.getElementById('modalMetaEmissorNome');
            if (modalTitleEl) modalTitleEl.textContent = emissorNome;

            // Carrega dados salvos anteriormente deste emissor ou reseta
            const savedData = metaDataByEmissor[currentMetaEmissorIdx] || {};

            const inputDtVenc = document.getElementById('metaDtVencimento');
            const selectRating = document.getElementById('metaSelectRating');
            const inputShare = document.getElementById('metaInputShare');

            if (inputDtVenc) inputDtVenc.value = savedData.dtVencimento || '';
            if (selectRating) selectRating.value = savedData.cdRating || '';
            if (inputShare) inputShare.value = savedData.shareDivida || '';

            const tbody = document.querySelector('#tabelaModalLimiteMeta tbody');
            if (tbody) {
                tbody.innerHTML = '';
                const rowsData = savedData.rows || [];
                if (rowsData.length > 0) {
                    rowsData.forEach(r => {
                        tbody.appendChild(createMetaTableRow(r));
                    });
                } else {
                    tbody.appendChild(createMetaTableRow());
                }
            }

            if (bsModal) bsModal.show();
        });
    });

    // Salvar/Confirmar dados do Modal
    const btnSalvarModalMeta = document.getElementById('btnSalvarModalMeta');
    if (btnSalvarModalMeta) {
        btnSalvarModalMeta.addEventListener('click', function () {
            if (currentMetaEmissorIdx === null) return;

            const inputDtVenc = document.getElementById('metaDtVencimento');
            if (inputDtVenc && !inputDtVenc.value.trim()) {
                alert("A Data de Vencimento do Limite Meta é obrigatória.");
                inputDtVenc.focus();
                return;
            }

            const selectRating = document.getElementById('metaSelectRating');
            const inputShare = document.getElementById('metaInputShare');

            const tbody = document.querySelector('#tabelaModalLimiteMeta tbody');
            const rows = tbody ? tbody.querySelectorAll('tr') : [];
            const rowsData = [];

            rows.forEach(row => {
                const prazo = row.querySelector('.input-prazo-meta')?.value || '';
                const terc = row.querySelector('.input-terceiros-meta')?.value || '';
                const rt = row.querySelector('.input-rt-meta')?.value || '';
                if (prazo !== '' || terc !== '' || rt !== '') {
                    rowsData.push({
                        prazo: prazo,
                        terceirosProposto: terc,
                        rtProposto: rt
                    });
                }
            });

            metaDataByEmissor[currentMetaEmissorIdx] = {
                dtVencimento: inputDtVenc ? inputDtVenc.value : '',
                cdRating: selectRating ? selectRating.value : '',
                shareDivida: inputShare ? inputShare.value : '',
                rows: rowsData
            };

            // Atualiza inputs ocultos no card do emissor para submissão do form
            const emissorCard = document.querySelector(`.emissor-card[data-emissor-index="${currentMetaEmissorIdx}"]`);
            if (emissorCard) {
                let hiddenContainer = emissorCard.querySelector('.hidden-meta-inputs');
                if (!hiddenContainer) {
                    hiddenContainer = document.createElement('div');
                    hiddenContainer.className = 'hidden-meta-inputs';
                    emissorCard.appendChild(hiddenContainer);
                }
                hiddenContainer.innerHTML = '';

                const meta = metaDataByEmissor[currentMetaEmissorIdx];
                const inputVenc = document.createElement('input');
                inputVenc.type = 'hidden';
                inputVenc.name = `emissores[${currentMetaEmissorIdx}][meta][dtVencimento]`;
                inputVenc.value = meta.dtVencimento;
                hiddenContainer.appendChild(inputVenc);

                const inputRat = document.createElement('input');
                inputRat.type = 'hidden';
                inputRat.name = `emissores[${currentMetaEmissorIdx}][meta][cdRating]`;
                inputRat.value = meta.cdRating;
                hiddenContainer.appendChild(inputRat);

                const inputSh = document.createElement('input');
                inputSh.type = 'hidden';
                inputSh.name = `emissores[${currentMetaEmissorIdx}][meta][shareDivida]`;
                inputSh.value = meta.shareDivida;
                hiddenContainer.appendChild(inputSh);

                meta.rows.forEach((r, rIdx) => {
                    const inPrazo = document.createElement('input');
                    inPrazo.type = 'hidden';
                    inPrazo.name = `emissores[${currentMetaEmissorIdx}][meta][rows][${rIdx}][prazo]`;
                    inPrazo.value = r.prazo;
                    hiddenContainer.appendChild(inPrazo);

                    const inTerc = document.createElement('input');
                    inTerc.type = 'hidden';
                    inTerc.name = `emissores[${currentMetaEmissorIdx}][meta][rows][${rIdx}][terceiros]`;
                    inTerc.value = r.terceirosProposto !== '' ? r.terceirosProposto : '0';
                    hiddenContainer.appendChild(inTerc);

                    const inRt = document.createElement('input');
                    inRt.type = 'hidden';
                    inRt.name = `emissores[${currentMetaEmissorIdx}][meta][rows][${rIdx}][rt]`;
                    inRt.value = r.rtProposto !== '' ? r.rtProposto : '0';
                    hiddenContainer.appendChild(inRt);
                });

                // Atualiza badge visual no botão do emissor
                const btnMeta = emissorCard.querySelector('.btn-open-meta-modal');
                if (btnMeta) {
                    btnMeta.classList.add('has-meta');
                    btnMeta.innerHTML = `<i class="bi bi-check2-circle text-success"></i> Limite Meta Configurado`;
                }
            }

            recalculateAll(); // <--- Recalcula o grupo consolidado considerando os novos metas!
            
            if (bsModal) bsModal.hide();
        });
    }

    const selectGrupo = document.getElementById('selectGrupoEconomico');
    const selectEvento = document.getElementById('selectTipoEvento');

    if (selectGrupo && selectEvento) {
        selectGrupo.addEventListener('change', async function () {
            const grupo = this.value;
            if (!grupo) {
                selectEvento.innerHTML = '<option value="" disabled selected>Selecione um grupo econômico primeiro...</option>';
                selectEvento.disabled = true;
                return;
            }

            selectEvento.disabled = true;
            selectEvento.innerHTML = '<option value="" disabled selected>Carregando eventos...</option>';

            try {
                const response = await fetch(`/solicitar-alcada/api/obtem-tipos-eventos?dsGrupo=${encodeURIComponent(grupo)}`);
                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Erro ao carregar tipos de eventos.');
                }

                const eventos = Array.isArray(result.data) ? result.data : [];
                selectEvento.innerHTML = '<option value="" disabled selected>Selecione um evento...</option>';

                if (eventos.length === 0) {
                    selectEvento.innerHTML = '<option value="" disabled selected>Nenhum evento disponível para este grupo</option>';
                    selectEvento.disabled = true;
                } else {
                    eventos.forEach(ev => {
                        const id = ev.idTipoEvento ?? ev.idEvento ?? ev.id ?? ev;
                        const nome = ev.dsTipoEvento ?? ev.dsEvento ?? ev.nome ?? ev;
                        const option = document.createElement('option');
                        option.value = nome;
                        option.textContent = nome;
                        selectEvento.appendChild(option);
                    });
                    selectEvento.disabled = false;
                }
            } catch (err) {
                console.error('Erro ao buscar eventos:', err);
                selectEvento.innerHTML = '<option value="" disabled selected>Erro ao carregar eventos</option>';
                selectEvento.disabled = true;
            }
        });
    }

    if (formSalvar) {
        formSalvar.addEventListener('submit', function (e) {
            // Se o formulário estiver em modo somente-leitura (Prorrogação), pode enviar normalmente
            if (isProrrogacao) return;

            recalculateAll();

            // 1. Validação do Rating Proposto do Grupo Econômico (Obrigatório)
            if (canEditRating) {
                const selectRatingGrupo = document.getElementById('selectRatingGrupoProposto');
                if (selectRatingGrupo && !selectRatingGrupo.value.trim()) {
                    e.preventDefault();
                    selectRatingGrupo.focus();
                    alert('Erro de validação: O Rating Proposto do Grupo Econômico é obrigatório.');
                    selectRatingGrupo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            }

            // 2. Validação do Rating Proposto de cada Emissor (Obrigatório se houver limites)
            if (canEditRating) {
                const emissorCards = document.querySelectorAll('.emissor-card');
                for (const card of emissorCards) {
                    const rows = card.querySelectorAll('.emissor-table-row');
                    // Só obriga o rating se o emissor tiver algum prazo cadastrado
                    if (rows.length > 0) {
                        const emissorNome = card.dataset.emissorNome || 'Emissor';
                        const selRating = card.querySelector('.select-rating-proposto-emissor');
                        if (selRating && !selRating.value.trim()) {
                            e.preventDefault();
                            selRating.focus();
                            alert(`Erro de validação: O Rating Proposto para o emissor "${emissorNome}" é obrigatório, pois existem limites cadastrados.`);
                            selRating.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }
                    }
                }
            }

            // 3. Validação dos Campos de Prazo e Descarte de Emissores Vazios
            if (canEditLimits) {
                const emissorCards = document.querySelectorAll('.emissor-card');
                for (const card of emissorCards) {
                    const emissorNome = card.dataset.emissorNome || 'Emissor';
                    const rows = card.querySelectorAll('.emissor-table-row');
                    const selRating = card.querySelector('.select-rating-proposto-emissor');
                    const ratingValue = selRating ? selRating.value.trim() : '';

                    // Se não houver nenhum limite...
                    if (rows.length === 0) {
                        // E também não houver rating, nós ignoramos completamente o emissor e não enviamos pro backend
                        if (!ratingValue) {
                            const allInputs = card.querySelectorAll('input, select, textarea');
                            allInputs.forEach(inp => inp.disabled = true);
                        }
                        continue;
                    }

                    for (const row of rows) {
                        const inputPrazo = row.querySelector('.input-prazo');
                        const inputTerc = row.querySelector('.input-terceiros-proposto');
                        const inputRt = row.querySelector('.input-rt-proposto');

                        // Validação de Prazo: obrigatório e inteiro positivo (> 0)
                        const prazoVal = inputPrazo ? parseInt(inputPrazo.value.trim(), 10) : NaN;
                        if (!inputPrazo || inputPrazo.value.trim() === '' || isNaN(prazoVal) || prazoVal <= 0) {
                            e.preventDefault();
                            inputPrazo?.focus();
                            alert(`Erro de validação: O campo Prazo é obrigatório e deve ser um número positivo (> 0) no emissor "${emissorNome}".`);
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }

                        // Validação de Terceiros Proposto: obrigatório e não negativo (>= 0)
                        if (!inputTerc || inputTerc.value.trim() === '') {
                            e.preventDefault();
                            inputTerc?.focus();
                            alert(`Erro de validação: O campo Terceiros Proposto é obrigatório no emissor "${emissorNome}".`);
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }
                        const tercVal = parseVal(inputTerc.value);
                        if (isNaN(tercVal) || tercVal < 0) {
                            e.preventDefault();
                            inputTerc.focus();
                            alert(`Erro de validação: O campo Terceiros Proposto deve ser positivo ou zero no emissor "${emissorNome}".`);
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }

                        // Validação de RT Proposto: obrigatório e não negativo (>= 0)
                        if (!inputRt || inputRt.value.trim() === '') {
                            e.preventDefault();
                            inputRt?.focus();
                            alert(`Erro de validação: O campo RT Proposto é obrigatório no emissor "${emissorNome}".`);
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }
                        const rtVal = parseVal(inputRt.value);
                        if (isNaN(rtVal) || rtVal < 0) {
                            e.preventDefault();
                            inputRt.focus();
                            alert(`Erro de validação: O campo RT Proposto deve ser positivo ou zero no emissor "${emissorNome}".`);
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }

                        // Validação: a linha deve ter ao menos um valor positivo (> 0)
                        if (tercVal + rtVal <= 0) {
                            e.preventDefault();
                            inputTerc.focus();
                            alert(`Erro de validação: A soma de Terceiros Proposto e RT Proposto deve ser maior que 0 para o prazo ${prazoVal} no emissor "${emissorNome}".`);
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }
                    }
                }
            }

            // 4. Validação de Cascata
            const cascadeViolations = document.querySelectorAll('.cascade-violation');
            if (cascadeViolations.length > 0) {
                e.preventDefault();
                alert('Erro de validação: Existem violações no sistema de cascata. Em cada emissor, o limite de um prazo maior não pode ser superior ao de um prazo menor.');
                cascadeViolations[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            // 5. Validação de Flexibilização
            if (isFlexibilizacao) {
                const flexViolations = document.querySelectorAll('.flex-violation');
                if (flexViolations.length > 0) {
                    e.preventDefault();
                    alert('Erro de validação: O limite proposto ultrapassa o teto máximo permitido para flexibilização em um ou mais emissores (Limite Atual + Disponível de Flexibilização).');
                    flexViolations[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            }

            // 6. Validação de Flexibilização sem Alteração de LMAX
            if (isFlexSemLmax) {
                const lmaxViolations = document.querySelectorAll('.lmax-violation');
                if (lmaxViolations.length > 0) {
                    e.preventDefault();
                    alert('Erro de validação: Na Flexibilização sem Alteração de LMAX, o limite total consolidado do grupo para cada prazo não pode exceder o limite atual. Reduza o valor em outro emissor para o mesmo prazo antes de salvar.');
                    lmaxViolations[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            }

            // 7. Validação de Prazos Duplicados no mesmo Emissor
            const tables = document.querySelectorAll('.table-emissor-unificada');
            let hasDuplicatePrazo = false;
            tables.forEach(tbl => {
                const prazosSet = new Set();
                const prazoInputs = tbl.querySelectorAll('.input-prazo');
                prazoInputs.forEach(pin => {
                    const pval = pin.value.trim();
                    if (pval !== '') {
                        if (prazosSet.has(pval)) {
                            hasDuplicatePrazo = true;
                            pin.classList.add('is-invalid');
                        } else {
                            prazosSet.add(pval);
                            pin.classList.remove('is-invalid');
                        }
                    }
                });
            });

            if (hasDuplicatePrazo) {
                e.preventDefault();
                alert('Erro de validação: Não é permitido cadastrar prazos duplicados para o mesmo emissor.');
                return;
            }
        });
    }

    // Inicialização completa
    recalculateAll();
});


