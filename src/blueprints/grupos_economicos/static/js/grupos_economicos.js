document.addEventListener('DOMContentLoaded', function () {
    const btnAdicionar = document.getElementById('btnAdicionarEmissor');
    const container = document.getElementById('emissoresContainer');
    const template = document.getElementById('emissorTemplate');
    const formActionsContainer = document.getElementById('formActionsContainer');

    // Modais e elementos de controle
    const modalElOC3 = document.getElementById('modalAssociarOC3');
    const modalElCRIMS = document.getElementById('modalAssociarCRIMS');
    const bsModalOC3 = modalElOC3 ? new bootstrap.Modal(modalElOC3) : null;
    const bsModalCRIMS = modalElCRIMS ? new bootstrap.Modal(modalElCRIMS) : null;

    // Referência do card de emissor atualmente em edição pelo modal
    let currentTargetCard = null;
    let currentModalType = null; 

    function maskCNPJ(value) {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .slice(0, 18);
    }

    document.addEventListener('input', function (e) {
        if (e.target && e.target.classList.contains('cnpj-mask')) {
            e.target.value = maskCNPJ(e.target.value);
        }
    });

    function updateEmissoresState() {
        const allBlocks = document.querySelectorAll('.emissor-card');
        const holdings = [];

        if (formActionsContainer) {
            if (allBlocks.length > 0) {
                formActionsContainer.classList.remove('d-none');
            } else {
                formActionsContainer.classList.add('d-none');
            }
        }

        // Atualiza numeração e coleta holdings com "sim" e nome preenchido
        allBlocks.forEach((block, index) => {
            block.dataset.emissorIndex = index;
            const titleSpan = block.querySelector('.emissor-title-text');
            if (titleSpan) {
                titleSpan.textContent = `Emissor #${index + 1}`;
            }

            const isHoldingSelect = block.querySelector('.select-is-holding');
            const nameInput = block.querySelector('.input-nome-emissor');

            if (isHoldingSelect && isHoldingSelect.value === 'sim' && nameInput && nameInput.value.trim() !== '') {
                holdings.push(nameInput.value.trim());
            }

            // Atualiza os nomes dos inputs ocultos com o índice correto
            updateHiddenInputs(block, index);
        });

        // Atualiza as opções do dropdown "Holding de Consumo" em todos os blocos
        allBlocks.forEach(block => {
            const consumoSelect = block.querySelector('.select-holding-consumo');
            if (consumoSelect) {
                const currentValue = consumoSelect.value;
                consumoSelect.innerHTML = '<option value="">Nenhuma</option>';

                holdings.forEach(holdingName => {
                    const option = document.createElement('option');
                    option.value = holdingName;
                    option.textContent = holdingName;
                    if (holdingName === currentValue) {
                        option.selected = true;
                    }
                    consumoSelect.appendChild(option);
                });
            }
        });
    }

    function updateHiddenInputs(card, index) {
        const hiddenContainer = card.querySelector('.hidden-associados-inputs');
        if (!hiddenContainer) return;

        hiddenContainer.innerHTML = '';
        const idx = index !== undefined ? index : (card.dataset.emissorIndex || 0);

        const oc3Items = card.oc3Items || [];
        oc3Items.forEach(item => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `emissores[${idx}][oc3_codigos][]`;
            input.value = item.codigo;
            hiddenContainer.appendChild(input);
        });

        const crimsItems = card.crimsItems || [];
        crimsItems.forEach(item => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `emissores[${idx}][crims_codigos][]`;
            input.value = item.codigo;
            hiddenContainer.appendChild(input);
        });
    }

    function renderAssociatedBadges(card, type) {
        const isOC3 = type === 'oc3';
        const items = isOC3 ? (card.oc3Items || []) : (card.crimsItems || []);
        const wrapper = isOC3 
            ? card.querySelector('.oc3-associados-wrapper')
            : card.querySelector('.crims-associados-wrapper');
        const listEl = isOC3
            ? card.querySelector('.oc3-badges-list')
            : card.querySelector('.crims-badges-list');
        const countBadge = isOC3
            ? card.querySelector('.oc3-badge-count')
            : card.querySelector('.crims-badge-count');

        if (!wrapper || !listEl) return;

        listEl.innerHTML = '';
        if (countBadge) countBadge.textContent = items.length;

        if (items.length > 0) {
            wrapper.classList.remove('d-none');
            items.forEach(item => {
                const chip = document.createElement('span');
                chip.className = 'associado-chip';
                chip.innerHTML = `
                    <span><strong>${item.codigo}</strong>${item.nome ? ' - ' + item.nome : ''}</span>
                    <button type="button" class="chip-remove-btn" title="Remover"><i class="bi bi-x"></i></button>
                `;
                chip.querySelector('.chip-remove-btn').addEventListener('click', function (e) {
                    e.stopPropagation();
                    removeAssociatedItem(card, type, item.codigo);
                });
                listEl.appendChild(chip);
            });
        } else {
            wrapper.classList.add('d-none');
        }

        updateHiddenInputs(card);
    }

    function removeAssociatedItem(card, type, codigo) {
        if (type === 'oc3') {
            card.oc3Items = (card.oc3Items || []).filter(item => String(item.codigo) !== String(codigo));
        } else {
            card.crimsItems = (card.crimsItems || []).filter(item => String(item.codigo) !== String(codigo));
        }
        renderAssociatedBadges(card, type);
    }

    function normalizeItem(raw) {
        if (typeof raw !== 'object' || raw === null) {
            return { codigo: String(raw), nome: '', cnpj: '' };
        }
        // cdEmissor (campo de interesse), dsEmissor e cdCnpj (informativos)
        const codigo = raw.cdEmissor ?? raw.cd_emissor ?? raw.codigo ?? raw.id ?? '';
        const nome = raw.dsEmissor ?? raw.nmEmissor ?? raw.nm_emissor ?? raw.nome ?? raw.descricao ?? '';
        const cnpj = raw.cdCnpj ?? raw.nrCnpj ?? raw.cnpj ?? raw.nr_cnpj ?? '';
        return { codigo: String(codigo), nome: String(nome), cnpj: String(cnpj), raw };
    }

    function setupModal(modalEl, type) {
        if (!modalEl) return;

        const isOC3 = type === 'oc3';
        const inputBusca = modalEl.querySelector('.input-busca-modal');
        const btnPesquisar = modalEl.querySelector(isOC3 ? '#btnPesquisarOC3' : '#btnPesquisarCRIMS');
        const btnConfirmar = modalEl.querySelector(isOC3 ? '#btnConfirmarOC3' : '#btnConfirmarCRIMS');
        const resultsArea = modalEl.querySelector('.modal-results-area');

        const initialEl = resultsArea.querySelector('.initial-state');
        const loadingEl = resultsArea.querySelector('.loading-state');
        const contentEl = resultsArea.querySelector('.content-state');
        const emptyEl = resultsArea.querySelector('.empty-state');
        const errorEl = resultsArea.querySelector('.error-state');
        const errorMsg = resultsArea.querySelector('.error-msg');
        const tbody = resultsArea.querySelector('.results-tbody');
        const countSpan = resultsArea.querySelector('.results-count');
        const selectAllCb = resultsArea.querySelector('.select-all-checkbox');

        let currentResults = [];

        function setViewState(state) {
            initialEl.classList.toggle('d-none', state !== 'initial');
            loadingEl.classList.toggle('d-none', state !== 'loading');
            contentEl.classList.toggle('d-none', state !== 'content');
            emptyEl.classList.toggle('d-none', state !== 'empty');
            errorEl.classList.toggle('d-none', state !== 'error');
        }

        async function doSearch() {
            const query = inputBusca.value.trim();
            setViewState('loading');

            const baseUrl = modalEl.dataset.url || (isOC3 ? '/grupos_economicos/api/emissores-oc3' : '/grupos_economicos/api/emissores-crims');
            const separator = baseUrl.includes('?') ? '&' : '?';
            const endpoint = `${baseUrl}${separator}dsEmissor=${encodeURIComponent(query)}`;

            try {
                const response = await fetch(endpoint);
                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Erro ao realizar a consulta.');
                }

                const data = Array.isArray(result.data) ? result.data : [];
                currentResults = data.map(normalizeItem);

                if (currentResults.length === 0) {
                    setViewState('empty');
                    return;
                }

                // Renderiza linhas
                renderTableRows();
                setViewState('content');
            } catch (err) {
                if (errorMsg) errorMsg.textContent = err.message || 'Falha na comunicação com o servidor.';
                setViewState('error');
            }
        }

        function renderTableRows() {
            tbody.innerHTML = '';
            if (selectAllCb) selectAllCb.checked = false;

            const existingItems = currentTargetCard 
                ? (isOC3 ? (currentTargetCard.oc3Items || []) : (currentTargetCard.crimsItems || []))
                : [];
            const existingCodes = new Set(existingItems.map(i => String(i.codigo)));

            currentResults.forEach((item, index) => {
                const tr = document.createElement('tr');
                const isChecked = existingCodes.has(String(item.codigo));
                const formattedCnpj = item.cnpj ? (item.cnpj.length >= 11 ? maskCNPJ(item.cnpj) : item.cnpj) : '-';

                tr.innerHTML = `
                    <td class="text-center">
                        <input class="form-check-input item-checkbox" type="checkbox" data-index="${index}" ${isChecked ? 'checked' : ''}>
                    </td>
                    <td>${formattedCnpj}</td>
                    <td>${item.codigo || '-'}</td>
                    <td>${item.nome || '-'}</td>
                `;

                const checkbox = tr.querySelector('.item-checkbox');
                checkbox.addEventListener('change', updateSelectAllState);

                tr.addEventListener('click', function (e) {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        updateSelectAllState();
                    }
                });

                tbody.appendChild(tr);
            });

            if (countSpan) {
                countSpan.textContent = `${currentResults.length} resultado(s) encontrado(s)`;
            }
            updateSelectAllState();
        }

        function updateSelectAllState() {
            const allCheckboxes = tbody.querySelectorAll('.item-checkbox');
            if (!selectAllCb || allCheckboxes.length === 0) return;

            const checkedCount = tbody.querySelectorAll('.item-checkbox:checked').length;
            selectAllCb.checked = checkedCount === allCheckboxes.length;
            selectAllCb.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
        }

        if (selectAllCb) {
            selectAllCb.addEventListener('change', function () {
                const checkboxes = tbody.querySelectorAll('.item-checkbox');
                checkboxes.forEach(cb => cb.checked = selectAllCb.checked);
            });
        }

        if (btnPesquisar) {
            btnPesquisar.addEventListener('click', doSearch);
        }

        if (inputBusca) {
            inputBusca.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    doSearch();
                }
            });
        }

        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', function () {
                if (!currentTargetCard) return;

                const checkedBoxes = tbody.querySelectorAll('.item-checkbox:checked');
                const selectedItems = [];

                checkedBoxes.forEach(cb => {
                    const idx = parseInt(cb.dataset.index, 10);
                    if (!isNaN(idx) && currentResults[idx]) {
                        selectedItems.push(currentResults[idx]);
                    }
                });

                if (isOC3) {
                    // Mescla mantendo os selecionados
                    currentTargetCard.oc3Items = selectedItems;
                    renderAssociatedBadges(currentTargetCard, 'oc3');
                    if (bsModalOC3) bsModalOC3.hide();
                } else {
                    currentTargetCard.crimsItems = selectedItems;
                    renderAssociatedBadges(currentTargetCard, 'crims');
                    if (bsModalCRIMS) bsModalCRIMS.hide();
                }
            });
        }

        // Ao abrir o modal, reseta ou foca
        modalEl.addEventListener('shown.bs.modal', function () {
            if (inputBusca) inputBusca.focus();
        });
    }

    setupModal(modalElOC3, 'oc3');
    setupModal(modalElCRIMS, 'crims');

    function setupEmissorCardListeners(card) {
        card.oc3Items = [];
        card.crimsItems = [];

        // Botão de remoção do emissor
        const btnRemove = card.querySelector('.remove-emissor-btn');
        if (btnRemove) {
            btnRemove.addEventListener('click', function () {
                card.remove();
                updateEmissoresState();
            });
        }

        // Botão associar OC3
        const btnOC3 = card.querySelector('.btn-associar-oc3');
        if (btnOC3) {
            btnOC3.addEventListener('click', function () {
                currentTargetCard = card;
                currentModalType = 'oc3';
                if (bsModalOC3) bsModalOC3.show();
            });
        }

        // Botão associar CRIMS
        const btnCRIMS = card.querySelector('.btn-associar-crims');
        if (btnCRIMS) {
            btnCRIMS.addEventListener('click', function () {
                currentTargetCard = card;
                currentModalType = 'crims';
                if (bsModalCRIMS) bsModalCRIMS.show();
            });
        }

        // Ouvintes para atualizar dinamicamente a lista de holdings
        const nameInput = card.querySelector('.input-nome-emissor');
        const isHoldingSelect = card.querySelector('.select-is-holding');

        if (nameInput) {
            nameInput.addEventListener('input', updateEmissoresState);
        }
        if (isHoldingSelect) {
            isHoldingSelect.addEventListener('change', updateEmissoresState);
        }
    }

    if (btnAdicionar && container && template) {
        btnAdicionar.addEventListener('click', function () {
            const clone = template.content.cloneNode(true);
            const emissorCard = clone.querySelector('.emissor-card');

            setupEmissorCardListeners(emissorCard);
            container.appendChild(clone);
            updateEmissoresState();

            // Scroll suave até o novo bloco adicionado
            if (emissorCard) {
                emissorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    // Formulário de Cadastro de Grupo Econômico
    const formCadastrarGrupo = document.getElementById('formCadastrarGrupo');
    const formAlert = document.getElementById('formAlert');
    const btnSalvarGrupo = document.getElementById('btnSalvarGrupo');

    function showFormAlert(message, type = 'danger') {
        if (!formAlert) return;
        formAlert.className = `alert alert-${type} mt-3 d-block`;
        formAlert.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>${message}`;
        formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideFormAlert() {
        if (!formAlert) return;
        formAlert.className = 'alert d-none mt-3';
        formAlert.innerHTML = '';
    }

    if (formCadastrarGrupo) {
        formCadastrarGrupo.addEventListener('submit', async function (e) {
            e.preventDefault();
            hideFormAlert();

            const nomeGrupoInput = document.getElementById('nomeGrupo');
            const dsGrupo = nomeGrupoInput ? nomeGrupoInput.value.trim() : '';

            if (!dsGrupo) {
                formCadastrarGrupo.classList.add('was-validated');
                if (nomeGrupoInput) nomeGrupoInput.focus();
                showFormAlert('Por favor, informe o nome do grupo econômico.', 'warning');
                return;
            }

            const emissorCards = container ? container.querySelectorAll('.emissor-card') : [];
            if (emissorCards.length === 0) {
                showFormAlert('Adicione ao menos um emissor ao grupo econômico antes de salvar.', 'warning');
                return;
            }

            // Validação dos campos de cada emissor
            let hasError = false;
            const emissores = [];

            emissorCards.forEach((card) => {
                const cdCnpj = card.querySelector('.cnpj-mask')?.value?.trim() || '';
                const dsEmissor = card.querySelector('.input-nome-emissor')?.value?.trim() || '';
                const isHoldingVal = card.querySelector('.select-is-holding')?.value;
                const consomeHoldingVal = card.querySelector('.select-consome-holding')?.value;
                const holdingConsumoVal = card.querySelector('.select-holding-consumo')?.value || null;
                const dsSetor = card.querySelector('.select-setor')?.value || null;
                const dsSubsetor = card.querySelector('.select-subsetor')?.value || null;

                if (!dsEmissor || !isHoldingVal || !consomeHoldingVal || !dsSetor) {
                    hasError = true;
                    card.classList.add('border-danger');
                } else {
                    card.classList.remove('border-danger');
                }

                const cdEmissoresOC3 = (card.oc3Items || []).map(i => String(i.codigo)).filter(Boolean);
                const cdEmissoresCRIMS = (card.crimsItems || []).map(i => String(i.codigo)).filter(Boolean);

                emissores.push({
                    cdCnpj: cdCnpj,
                    dsEmissor: dsEmissor,
                    icHolding: isHoldingVal === 'sim' ? 1 : 0,
                    icConsomeHolding: consomeHoldingVal === 'sim' ? 1 : 0,
                    dsEmissorHoldingConsumo: (consomeHoldingVal === 'sim' && holdingConsumoVal && holdingConsumoVal !== 'Nenhuma') ? holdingConsumoVal : null,
                    dsSetor: dsSetor,
                    dsSubsetor: dsSubsetor,
                    cdEmissoresOC3: cdEmissoresOC3,
                    cdEmissoresCRIMS: cdEmissoresCRIMS
                });
            });

            if (hasError || !formCadastrarGrupo.checkValidity()) {
                formCadastrarGrupo.classList.add('was-validated');
                showFormAlert('Por favor, preencha todos os campos obrigatórios (*) dos emissores adicionados.', 'warning');
                return;
            }

            const payload = {
                dsGrupo: dsGrupo,
                emissores: emissores
            };

            // Loading state no botão
            const originalBtnHtml = btnSalvarGrupo ? btnSalvarGrupo.innerHTML : '';
            if (btnSalvarGrupo) {
                btnSalvarGrupo.disabled = true;
                btnSalvarGrupo.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Cadastrando grupo econômico...';
            }

            try {
                const response = await fetch(window.location.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Erro ao registrar o grupo econômico.');
                }

                showFormAlert(result.message || 'Grupo econômico registrado com sucesso!', 'success');

                setTimeout(() => {
                    window.location.href = result.redirect_url || '/grupos-economicos/';
                }, 1200);

            } catch (err) {
                showFormAlert(err.message || 'Falha na comunicação com o servidor ao tentar salvar.', 'danger');
                if (btnSalvarGrupo) {
                    btnSalvarGrupo.disabled = false;
                    btnSalvarGrupo.innerHTML = originalBtnHtml;
                }
            }
        });
    }
});

