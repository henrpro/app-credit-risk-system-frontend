document.addEventListener('DOMContentLoaded', function () {
    // Modais de Confirmação Bootstrap
    const modalAprovacaoEl = document.getElementById('modalConfirmarAprovacao');
    const bsModalAprovacao = modalAprovacaoEl ? new bootstrap.Modal(modalAprovacaoEl) : null;

    const modalCancelamentoEl = document.getElementById('modalConfirmarCancelamento');
    const bsModalCancelamento = modalCancelamentoEl ? new bootstrap.Modal(modalCancelamentoEl) : null;

    // Elementos do Modal de Envio para Aprovação
    const inputAprovacaoIdSolicitacao = document.getElementById('inputAprovacaoIdSolicitacao');
    const aprovacaoIdDisplay = document.getElementById('aprovacaoIdDisplay');
    const aprovacaoGrupoDisplay = document.getElementById('aprovacaoGrupoDisplay');

    document.querySelectorAll('.btn-abrir-aprovacao').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const idSolicitacao = this.getAttribute('data-id');
            const dsGrupo = this.getAttribute('data-grupo') || '';

            if (inputAprovacaoIdSolicitacao) inputAprovacaoIdSolicitacao.value = idSolicitacao;
            if (aprovacaoIdDisplay) aprovacaoIdDisplay.textContent = '#' + idSolicitacao;
            if (aprovacaoGrupoDisplay) aprovacaoGrupoDisplay.textContent = dsGrupo;

            if (bsModalAprovacao) {
                bsModalAprovacao.show();
            }
        });
    });

    // Elementos do Modal de Cancelamento
    const inputCancelarIdSolicitacao = document.getElementById('inputCancelarIdSolicitacao');
    const cancelarIdDisplay = document.getElementById('cancelarIdDisplay');
    const cancelarGrupoDisplay = document.getElementById('cancelarGrupoDisplay');

    document.querySelectorAll('.btn-abrir-cancelamento').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const idSolicitacao = this.getAttribute('data-id');
            const dsGrupo = this.getAttribute('data-grupo') || '';

            if (inputCancelarIdSolicitacao) inputCancelarIdSolicitacao.value = idSolicitacao;
            if (cancelarIdDisplay) cancelarIdDisplay.textContent = '#' + idSolicitacao;
            if (cancelarGrupoDisplay) cancelarGrupoDisplay.textContent = dsGrupo;

            if (bsModalCancelamento) {
                bsModalCancelamento.show();
            }
        });
    });

    // Busca e Filtro Dinâmico de Solicitações
    const filtroInput = document.getElementById('filtroSolicitacoes');
    const contadorSpan = document.getElementById('contadorSolicitacoes');
    const cards = document.querySelectorAll('.solicitacao-card');

    if (filtroInput) {
        filtroInput.addEventListener('input', function () {
            const termo = this.value.toLowerCase().trim();
            let visiveis = 0;

            cards.forEach(function (card) {
                const id = (card.getAttribute('data-id') || '').toLowerCase();
                const grupo = (card.getAttribute('data-grupo') || '').toLowerCase();
                const nome = (card.getAttribute('data-nome') || '').toLowerCase();
                const profile = (card.getAttribute('data-profile') || '').toLowerCase();
                const evento = (card.getAttribute('data-evento') || '').toLowerCase();
                const status = (card.getAttribute('data-status') || '').toLowerCase();

                if (id.includes(termo) || grupo.includes(termo) || nome.includes(termo) || profile.includes(termo) || evento.includes(termo) || status.includes(termo)) {
                    card.style.display = '';
                    visiveis++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (contadorSpan) {
                contadorSpan.textContent = visiveis;
            }
        });
    }
});
