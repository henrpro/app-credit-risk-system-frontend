document.addEventListener('DOMContentLoaded', function () {

    // Filtro genérico para linhas de tabelas
    function setupTableFilter(inputId, rowSelector, counterId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.addEventListener('input', function () {
            const termo = this.value.toLowerCase().trim();
            const rows = document.querySelectorAll(rowSelector);
            let visiveis = 0;

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(termo)) {
                    row.style.display = '';
                    visiveis++;
                } else {
                    row.style.display = 'none';
                }
            });

            const counter = document.getElementById(counterId);
            if (counter) {
                counter.textContent = visiveis;
            }
        });
    }

    // Configura filtros para as abas de atuais e pendentes
    setupTableFilter('filtroProdutosTabela', '.produto-row', 'contadorProdutos');
    setupTableFilter('filtroPendentesProdutosTabela', '.pendente-produto-row', 'contadorPendentesProdutos');

    setupTableFilter('filtroManagersTabela', '.manager-row', 'contadorManagers');
    setupTableFilter('filtroPendentesManagersTabela', '.pendente-manager-row', 'contadorPendentesManagers');

    setupTableFilter('filtroAtivosTabela', '.ativo-row', 'contadorAtivos');
    setupTableFilter('filtroPendentesAtivosTabela', '.pendente-ativo-row', 'contadorPendentesAtivos');

    // _________________________________________________________________________
    // 1. PRODUTOS OC3
    // _________________________________________________________________________
    const modalProdutoEl = document.getElementById('modalProduto');
    const bsModalProduto = modalProdutoEl ? new bootstrap.Modal(modalProdutoEl) : null;

    const modalExclusaoProdutoEl = document.getElementById('modalConfirmarExclusaoProduto');
    const bsModalExclusaoProduto = modalExclusaoProdutoEl ? new bootstrap.Modal(modalExclusaoProdutoEl) : null;

    const formProduto = document.getElementById('formProduto');
    const inputCdProdutoOC3 = document.getElementById('inputCdProdutoOC3');
    const selectIcCaptura = document.getElementById('selectIcCaptura');
    const modalProdutoTitleText = document.getElementById('modalHeaderTitleText');
    const btnSalvarProdutoText = document.getElementById('btnSalvarProdutoText');

    const btnAbrirModalNovoProduto = document.getElementById('btnAbrirModalNovoProduto');
    if (btnAbrirModalNovoProduto) {
        btnAbrirModalNovoProduto.addEventListener('click', function () {
            abrirModalNovoProduto();
        });
    }

    function abrirModalNovoProduto(cdProdutoPrefill = '') {
        if (!formProduto) return;
        formProduto.reset();
        formProduto.classList.remove('was-validated');

        inputCdProdutoOC3.value = cdProdutoPrefill;
        inputCdProdutoOC3.readOnly = false;
        selectIcCaptura.value = '1';

        if (modalProdutoTitleText) modalProdutoTitleText.textContent = cdProdutoPrefill ? 'Mapear Produto OC3' : 'Adicionar Mapeamento de Produto';
        if (btnSalvarProdutoText) btnSalvarProdutoText.textContent = 'Salvar Mapeamento';

        if (bsModalProduto) bsModalProduto.show();
    }

    function abrirModalAlterarProduto(cdProduto, icCaptura) {
        if (!formProduto) return;
        formProduto.reset();
        formProduto.classList.remove('was-validated');

        inputCdProdutoOC3.value = cdProduto;
        inputCdProdutoOC3.readOnly = true;
        selectIcCaptura.value = String(icCaptura);

        if (modalProdutoTitleText) modalProdutoTitleText.textContent = 'Alterar Mapeamento de Produto';
        if (btnSalvarProdutoText) btnSalvarProdutoText.textContent = 'Salvar Alterações';

        if (bsModalProduto) bsModalProduto.show();
    }

    // _________________________________________________________________________
    // 2. NOVOS MANAGERS
    // _________________________________________________________________________
    const modalManagerEl = document.getElementById('modalManager');
    const bsModalManager = modalManagerEl ? new bootstrap.Modal(modalManagerEl) : null;

    const modalExclusaoManagerEl = document.getElementById('modalConfirmarExclusaoManager');
    const bsModalExclusaoManager = modalExclusaoManagerEl ? new bootstrap.Modal(modalExclusaoManagerEl) : null;

    const formManager = document.getElementById('formManager');
    const inputDsManager = document.getElementById('inputDsManager');
    const selectCdMesa = document.getElementById('selectCdMesa');
    const modalManagerTitleText = document.getElementById('modalHeaderTitleText');
    const btnSalvarManagerText = document.getElementById('btnSalvarManagerText');

    const btnAbrirModalNovoManager = document.getElementById('btnAbrirModalNovoManager');
    if (btnAbrirModalNovoManager) {
        btnAbrirModalNovoManager.addEventListener('click', function () {
            abrirModalNovoManager();
        });
    }

    function abrirModalNovoManager(dsManagerPrefill = '') {
        if (!formManager) return;
        formManager.reset();
        formManager.classList.remove('was-validated');

        inputDsManager.value = dsManagerPrefill;
        inputDsManager.readOnly = false;
        selectCdMesa.value = '';

        if (modalManagerTitleText) modalManagerTitleText.textContent = dsManagerPrefill ? 'Mapear Manager' : 'Adicionar Mapeamento de Manager';
        if (btnSalvarManagerText) btnSalvarManagerText.textContent = 'Salvar Mapeamento';

        if (bsModalManager) bsModalManager.show();
    }

    function abrirModalAlterarManager(dsManager, cdMesa) {
        if (!formManager) return;
        formManager.reset();
        formManager.classList.remove('was-validated');

        inputDsManager.value = dsManager;
        inputDsManager.readOnly = true;
        selectCdMesa.value = cdMesa;

        if (modalManagerTitleText) modalManagerTitleText.textContent = 'Alterar Mapeamento de Manager';
        if (btnSalvarManagerText) btnSalvarManagerText.textContent = 'Salvar Alterações';

        if (bsModalManager) bsModalManager.show();
    }

    // _________________________________________________________________________
    // 3. EMISSOR DE CONSUMO (ATIVOS)
    // _________________________________________________________________________
    const modalAtivoEl = document.getElementById('modalAtivo');
    const bsModalAtivo = modalAtivoEl ? new bootstrap.Modal(modalAtivoEl) : null;

    const modalExclusaoAtivoEl = document.getElementById('modalConfirmarExclusaoAtivo');
    const bsModalExclusaoAtivo = modalExclusaoAtivoEl ? new bootstrap.Modal(modalExclusaoAtivoEl) : null;

    const formAtivo = document.getElementById('formAtivo');
    const inputCdTicker = document.getElementById('inputCdTicker');
    const selectIdEmissor = document.getElementById('selectIdEmissor');
    const selectIdEmissorConsumo = document.getElementById('selectIdEmissorConsumo');
    const inputVlPcConsumo = document.getElementById('inputVlPcConsumo');
    const modalAtivoTitleText = document.getElementById('modalHeaderTitleText');
    const btnSalvarAtivoText = document.getElementById('btnSalvarAtivoText');

    const btnAbrirModalNovoAtivo = document.getElementById('btnAbrirModalNovoAtivo');
    if (btnAbrirModalNovoAtivo) {
        btnAbrirModalNovoAtivo.addEventListener('click', function () {
            abrirModalNovoAtivo();
        });
    }

    function abrirModalNovoAtivo(cdTickerPrefill = '') {
        if (!formAtivo) return;
        formAtivo.reset();
        formAtivo.classList.remove('was-validated');

        inputCdTicker.value = cdTickerPrefill;
        inputCdTicker.readOnly = false;
        selectIdEmissor.value = '';
        selectIdEmissorConsumo.value = '';
        inputVlPcConsumo.value = '1.0';

        if (modalAtivoTitleText) modalAtivoTitleText.textContent = cdTickerPrefill ? 'Mapear Ativo de Consumo' : 'Adicionar Mapeamento de Ativo';
        if (btnSalvarAtivoText) btnSalvarAtivoText.textContent = 'Salvar Mapeamento';

        if (bsModalAtivo) bsModalAtivo.show();
    }

    function abrirModalAlterarAtivo(cdTicker, idEmissor, idEmissorConsumo, vlPcConsumo) {
        if (!formAtivo) return;
        formAtivo.reset();
        formAtivo.classList.remove('was-validated');

        inputCdTicker.value = cdTicker;
        inputCdTicker.readOnly = true;
        selectIdEmissor.value = String(idEmissor || '');
        selectIdEmissorConsumo.value = String(idEmissorConsumo || '');
        inputVlPcConsumo.value = vlPcConsumo !== null && vlPcConsumo !== undefined ? vlPcConsumo : '1.0';

        if (modalAtivoTitleText) modalAtivoTitleText.textContent = 'Alterar Mapeamento de Ativo';
        if (btnSalvarAtivoText) btnSalvarAtivoText.textContent = 'Salvar Alterações';

        if (bsModalAtivo) bsModalAtivo.show();
    }

    // _________________________________________________________________________
    // EVENT DELEGATION GLOBAL (Cliques em botões das tabelas)
    // _________________________________________________________________________
    document.addEventListener('click', function (e) {
        
        // --- PRODUTOS ---
        const btnEditProd = e.target.closest('.btn-alterar-produto');
        if (btnEditProd) {
            const prod = btnEditProd.getAttribute('data-produto');
            const cap = btnEditProd.getAttribute('data-captura');
            abrirModalAlterarProduto(prod, cap);
            return;
        }

        const btnDelProd = e.target.closest('.btn-excluir-produto');
        if (btnDelProd) {
            const prod = btnDelProd.getAttribute('data-produto');
            const inputDel = document.getElementById('inputDeleteCdProdutoOC3');
            const displayDel = document.getElementById('deleteProdutoDisplay');
            if (inputDel) inputDel.value = prod;
            if (displayDel) displayDel.textContent = prod;
            if (bsModalExclusaoProduto) bsModalExclusaoProduto.show();
            return;
        }

        const btnMapProd = e.target.closest('.btn-mapear-pendente-produto');
        if (btnMapProd) {
            const prod = btnMapProd.getAttribute('data-produto');
            abrirModalNovoProduto(prod);
            return;
        }

        // --- MANAGERS ---
        const btnEditMan = e.target.closest('.btn-alterar-manager');
        if (btnEditMan) {
            const manager = btnEditMan.getAttribute('data-manager');
            const mesa = btnEditMan.getAttribute('data-mesa');
            abrirModalAlterarManager(manager, mesa);
            return;
        }

        const btnDelMan = e.target.closest('.btn-excluir-manager');
        if (btnDelMan) {
            const manager = btnDelMan.getAttribute('data-manager');
            const inputDel = document.getElementById('inputDeleteDsManager');
            const displayDel = document.getElementById('deleteManagerDisplay');
            if (inputDel) inputDel.value = manager;
            if (displayDel) displayDel.textContent = manager;
            if (bsModalExclusaoManager) bsModalExclusaoManager.show();
            return;
        }

        const btnMapMan = e.target.closest('.btn-mapear-pendente-manager');
        if (btnMapMan) {
            const manager = btnMapMan.getAttribute('data-manager');
            abrirModalNovoManager(manager);
            return;
        }

        // --- ATIVOS ---
        const btnEditAtivo = e.target.closest('.btn-alterar-ativo');
        if (btnEditAtivo) {
            const ticker = btnEditAtivo.getAttribute('data-ticker');
            const emissor = btnEditAtivo.getAttribute('data-emissor');
            const consumo = btnEditAtivo.getAttribute('data-consumo');
            const perc = btnEditAtivo.getAttribute('data-percentual');
            abrirModalAlterarAtivo(ticker, emissor, consumo, perc);
            return;
        }

        const btnDelAtivo = e.target.closest('.btn-excluir-ativo');
        if (btnDelAtivo) {
            const ticker = btnDelAtivo.getAttribute('data-ticker');
            const inputDel = document.getElementById('inputDeleteCdTicker');
            const displayDel = document.getElementById('deleteTickerDisplay');
            if (inputDel) inputDel.value = ticker;
            if (displayDel) displayDel.textContent = ticker;
            if (bsModalExclusaoAtivo) bsModalExclusaoAtivo.show();
            return;
        }

        const btnMapAtivo = e.target.closest('.btn-mapear-pendente-ativo');
        if (btnMapAtivo) {
            const ticker = btnMapAtivo.getAttribute('data-ticker');
            abrirModalNovoAtivo(ticker);
            return;
        }
    });

});
